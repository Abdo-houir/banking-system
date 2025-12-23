// app/api/transactions/withdrawal/route.ts
import { requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { formatZodError } from '@/validation/auth';
import { TransactionTypes, WithdrawalSchema, calculateTransactionFee, generateReferenceNumber } from '@/validation/transaction';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['CUSTOMER', 'TELLER', 'MANAGER', 'ADMIN']);
    const body = await request.json();
    
    // Validate input
    const validationResult = WithdrawalSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = formatZodError(validationResult.error);
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    const { accountId, amount } = data;
    
    // Verify PIN (in real app, this would be hashed comparison)
    // For demo purposes, we'll skip actual PIN verification
    
    // Get account
    const account = await prisma.account.findFirst({
      where: {
        id: parseInt(accountId),
        customerId: user.userId,
      },
      include: {
        accountStatus: true,
        accountType: true,
      },
    });
    
    if (!account) {
      return NextResponse.json(
        { success: false, message: 'Account not found or access denied' },
        { status: 404 }
      );
    }
    
    if (account.accountStatus.status !== 'active') {
      return NextResponse.json(
        { success: false, message: `Account is ${account.accountStatus.status}` },
        { status: 400 }
      );
    }
    
    // Check if account is a loan account (cannot withdraw from loan)
    if (account.accountType.type === 'loan') {
      return NextResponse.json(
        { success: false, message: 'Cannot withdraw from a loan account' },
        { status: 400 }
      );
    }
    
    // Check monthly withdrawal limit for savings
    if (account.accountType.type === 'savings') {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const monthlyWithdrawals = await prisma.transaction.count({
        where: {
          accountId: account.id,
          createdAt: { gte: firstDayOfMonth },
          transactionType: { type: { in: [TransactionTypes.WITHDRAWAL, TransactionTypes.TRANSFER] } },
        },
      });
      
      if (monthlyWithdrawals >= (account.monthlyWithdrawalLimit || 6)) {
        return NextResponse.json(
          { success: false, message: 'Monthly withdrawal limit exceeded for savings account' },
          { status: 400 }
        );
      }
    }
    
    // Check daily withdrawal limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayWithdrawals = await prisma.transaction.aggregate({
      where: {
        accountId: account.id,
        createdAt: { gte: today },
        transactionType: { type: TransactionTypes.WITHDRAWAL },
      },
      _sum: { amount: true },
    });
    
    const dailyTotal = Math.abs(todayWithdrawals._sum.amount || 0);
    if (dailyTotal + amount > 10000) {
      return NextResponse.json(
        { success: false, message: 'Daily withdrawal limit exceeded ($10,000)' },
        { status: 400 }
      );
    }
    
    // Check sufficient balance
    const availableBalance = account.balance + (account.overdraftLimit || 0);
    const fee = calculateTransactionFee(amount, TransactionTypes.WITHDRAWAL, account.accountType.type);
    const totalAmount = amount + fee;
    
    if (totalAmount > availableBalance) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Insufficient funds. Available: $${availableBalance.toFixed(2)}`,
          data: { availableBalance }
        },
        { status: 400 }
      );
    }
    
    // Get transaction type and status
    const transactionType = await prisma.transactionType.findUnique({
      where: { type: TransactionTypes.WITHDRAWAL }
    });
    
    const transactionStatus = await prisma.transactionStatus.findUnique({
      where: { status: 'completed' }
    });
    
    if (!transactionType || !transactionStatus) {
      return NextResponse.json(
        { success: false, message: 'System configuration error' },
        { status: 500 }
      );
    }
    
    // Process withdrawal
    const result = await prisma.$transaction(async (tx) => {
      // Update account balance
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { 
          balance: { decrement: totalAmount },
          updatedAt: new Date(),
        },
      });
      
      const referenceNumber = generateReferenceNumber(TransactionTypes.WITHDRAWAL);
      
      // Create withdrawal transaction
      const transaction = await tx.transaction.create({
        data: {
          accountId: account.id,
          userId: user.userId,
          transactionTypeId: transactionType.id,
          transactionStatusId: transactionStatus.id,
          amount: -amount, // Negative for withdrawal
          referenceNumber,
        },
      });
      
      // Create account transaction record
      await tx.accountTransaction.create({
        data: {
          balanceBefore: account.balance,
          balanceAfter: updatedAccount.balance,
          accountId: account.id,
          transactionId: transaction.id,
        },
      });
      
      // Create fee transaction if applicable
      if (fee > 0) {
        const feeType = await tx.transactionType.findUnique({
          where: { type: 'fee' }
        });
        
        if (feeType) {
          await tx.transaction.create({
            data: {
              accountId: account.id,
              userId: user.userId,
              transactionTypeId: feeType.id,
              transactionStatusId: transactionStatus.id,
              amount: -fee,
              referenceNumber: `${referenceNumber}-FEE`,
            },
          });
        }
      }
      
      // Create notification
      await tx.notification.create({
        data: {
          userId: account.customerId,
          title: 'Withdrawal Completed',
          message: `Withdrawal of $${amount.toFixed(2)} processed from your account`,
          type: 'TRANSACTION',
        },
      });
      
      return {
        transaction,
        referenceNumber,
        fee,
        newBalance: updatedAccount.balance,
      };
    });
    
    const response: ApiResponse = {
      success: true,
      message: 'Withdrawal completed successfully',
      data: {
        transaction: result.transaction,
        referenceNumber: result.referenceNumber,
        fee: result.fee,
        newBalance: result.newBalance,
      },
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}