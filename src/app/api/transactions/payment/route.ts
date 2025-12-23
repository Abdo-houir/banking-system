// app/api/transactions/payment/route.ts
import { requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { formatZodError } from '@/validation/auth';
import { PaymentSchema, TransactionTypes, calculateTransactionFee, generateReferenceNumber } from '@/validation/transaction';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['CUSTOMER', 'TELLER', 'MANAGER', 'ADMIN']);
    const body = await request.json();
    
    // Validate input
    const validationResult = PaymentSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = formatZodError(validationResult.error);
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    const { accountId, amount, payeeName, isRecurring } = data;
    
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
    
    // Check if account is a loan account
    if (account.accountType.type === 'loan') {
      return NextResponse.json(
        { success: false, message: 'Cannot make payments from a loan account' },
        { status: 400 }
      );
    }
    
    // Check sufficient balance
    const availableBalance = account.balance + (account.overdraftLimit || 0);
    const fee = calculateTransactionFee(amount, TransactionTypes.PAYMENT, account.accountType.type);
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
      where: { type: TransactionTypes.PAYMENT }
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
    
    // Process payment
    const result = await prisma.$transaction(async (tx) => {
      // Update account balance
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { 
          balance: { decrement: totalAmount },
          updatedAt: new Date(),
        },
      });
      
      const referenceNumber = generateReferenceNumber(TransactionTypes.PAYMENT);
      
      // Create payment transaction
      const transaction = await tx.transaction.create({
        data: {
          accountId: account.id,
          userId: user.userId,
          transactionTypeId: transactionType.id,
          transactionStatusId: transactionStatus.id,
          amount: -amount, // Negative for payment
          // description: `${description} - Payment to ${payeeName} (${billType})`,
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
              // description: 'Bill payment fee',
              referenceNumber: `${referenceNumber}-FEE`,
            },
          });
        }
      }
      
      // // Store payee info if new
      // await tx.payee.upsert({
      //   where: { 
      //     customerId_accountNumber: {
      //       customerId: account.customerId,
      //       accountNumber: payeeAccount,
      //     }
      //   },
      //   update: { 
      //     name: payeeName,
      //     lastUsed: new Date(),
      //   },
      //   create: {
      //     customerId: account.customerId,
      //     name: payeeName,
      //     accountNumber: payeeAccount,
      //     billType,
      //     lastUsed: new Date(),
      //   },
      // });
      
      // Create notification
      await tx.notification.create({
        data: {
          userId: account.customerId,
          title: isRecurring ? 'Payment Scheduled' : 'Payment Sent',
          message: `Payment of $${amount.toFixed(2)} sent to ${payeeName}`,
          type: 'TRANSACTION',
        },
      });
      
      return {
        transaction,
        referenceNumber,
        fee,
        newBalance: updatedAccount.balance,
        isRecurring,
      };
    });
    
    const response: ApiResponse = {
      success: true,
      message: result.isRecurring 
        ? 'Payment scheduled successfully' 
        : 'Payment completed successfully',
      data: {
        transaction: result.transaction,
        referenceNumber: result.referenceNumber,
        fee: result.fee,
        newBalance: result.newBalance,
        isRecurring: result.isRecurring,
      },
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Payment error:', error);
    
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process payment' },
      { status: 500 }
    );
  }
}