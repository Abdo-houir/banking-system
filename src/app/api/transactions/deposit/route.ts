// app/api/transactions/deposit/route.ts
import { requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { formatZodError } from '@/validation/auth';
import { DepositSchema, TransactionTypes, generateReferenceNumber } from '@/validation/transaction';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['CUSTOMER', 'TELLER', 'MANAGER', 'ADMIN']);
    const body = await request.json();
    
    // Validate input
    const validationResult = DepositSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = formatZodError(validationResult.error);
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    const { accountId, amount, depositMethod } = data;
    
    // Get account
    const account = await prisma.account.findFirst({
      where: {
        id: parseInt(accountId),
        ...(user.role === 'CUSTOMER' ? { customerId: user.userId } : {}),
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
    
    // Check deposit limits
    let maxDeposit = 50000; // Default max
    let holdPeriod = 0; // Days to hold funds
    
    if (depositMethod === 'cash') {
      maxDeposit = 10000;
    } else if (depositMethod === 'check') {
      maxDeposit = 50000;
      holdPeriod = 2; // Business days
    }
    
    if (amount > maxDeposit) {
      return NextResponse.json(
        { success: false, message: `Maximum ${depositMethod} deposit is $${maxDeposit}` },
        { status: 400 }
      );
    }
    
    // Get transaction type and status
    const transactionType = await prisma.transactionType.findUnique({
      where: { type: TransactionTypes.DEPOSIT }
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
    
    // Process deposit
    const result = await prisma.$transaction(async (tx) => {
      // Update account balance
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { 
          balance: { increment: amount },
          updatedAt: new Date(),
        },
      });
      
      const referenceNumber = generateReferenceNumber(TransactionTypes.DEPOSIT);
      
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          accountId: account.id,
          userId: user.userId,
          transactionTypeId: transactionType.id,
          transactionStatusId: transactionStatus.id,
          amount: amount,
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
      
      // Create notification
      await tx.notification.create({
        data: {
          userId: account.customerId,
          title: 'Deposit Completed',
          message: `Deposit of $${amount.toFixed(2)} has been added to your account`,
          type: 'TRANSACTION',
        },
      });
      
      return {
        transaction,
        referenceNumber,
        newBalance: updatedAccount.balance,
        holdPeriod,
      };
    });
    
    const response: ApiResponse = {
      success: true,
      message: holdPeriod > 0 
        ? `Deposit successful. Funds will be available in ${holdPeriod} business days.`
        : 'Deposit completed successfully',
      data: {
        transaction: result.transaction,
        referenceNumber: result.referenceNumber,
        newBalance: result.newBalance,
        holdPeriod: result.holdPeriod,
      },
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Deposit error:', error);
    
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process deposit' },
      { status: 500 }
    );
  }
}