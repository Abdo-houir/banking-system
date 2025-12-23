// app/api/transactions/transfer/route.ts
import { requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { formatZodError } from '@/validation/auth';
import { TransactionTypes, TransferSchema, calculateTransactionFee, generateReferenceNumber } from '@/validation/transaction';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['CUSTOMER', 'TELLER', 'MANAGER', 'ADMIN']);
    const body = await request.json();

    // Validate input
    const validationResult = TransferSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = formatZodError(validationResult.error);
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const { fromAccountId, toAccountNumber, amount, description, isScheduled, scheduledFor } = data;

    // Get source account with type info
    const fromAccount = await prisma.account.findFirst({
      where: {
        id: parseInt(fromAccountId),
        customerId: user.userId,
      },
      include: {
        accountStatus: true,
        accountType: true,
      },
    });

    if (!fromAccount) {
      return NextResponse.json(
        { success: false, message: 'Source account not found or access denied' },
        { status: 404 }
      );
    }

    // Check if source account is active
    if (fromAccount.accountStatus.status !== 'active') {
      return NextResponse.json(
        { success: false, message: `Source account is ${fromAccount.accountStatus.status}` },
        { status: 400 }
      );
    }

    // Get destination account
    const toAccount = await prisma.account.findUnique({
      where: { accountNumber: toAccountNumber },
      include: {
        accountStatus: true,
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!toAccount) {
      return NextResponse.json(
        { success: false, message: 'Destination account not found' },
        { status: 404 }
      );
    }

    if (toAccount.accountStatus.status !== 'active') {
      return NextResponse.json(
        { success: false, message: `Destination account is ${toAccount.accountStatus.status}` },
        { status: 400 }
      );
    }

    // Check if transfer is scheduled
    if (isScheduled && scheduledFor) {
      // Handle scheduled transfer
      return await handleScheduledTransfer({
        user,
        fromAccount,
        toAccount,
        amount,
        description,
        scheduledFor,
        fee: calculateTransactionFee(amount, TransactionTypes.TRANSFER, fromAccount.accountType.type)
      });
    } else {
      // Handle immediate transfer
      return await handleImmediateTransfer({
        user,
        fromAccount,
        toAccount,
        amount,
        description,
        fee: calculateTransactionFee(amount, TransactionTypes.TRANSFER, fromAccount.accountType.type)
      });
    }

  } catch (error: any) {
    console.error('Transfer error:', error);

    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process transfer' },
      { status: 500 }
    );
  }
}

// Helper function for scheduled transfers
async function handleScheduledTransfer({
  user,
  fromAccount,
  toAccount,
  amount,
  scheduledFor,
  fee
}: {
  user: any;
  fromAccount: any;
  toAccount: any;
  amount: number;
  description?: string;
  scheduledFor: Date;
  fee: number;
}) {
  const totalAmount = amount + fee;

  // Validate scheduled date
  const now = new Date();
  const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Minimum 24 hours from now
  const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // Maximum 1 year from now

  if (scheduledFor < minDate) {
    return NextResponse.json(
      {
        success: false,
        message: 'Scheduled date must be at least 24 hours from now'
      },
      { status: 400 }
    );
  }

  if (scheduledFor > maxDate) {
    return NextResponse.json(
      {
        success: false,
        message: 'Scheduled date cannot be more than 1 year from now'
      },
      { status: 400 }
    );
  }

  // Check sufficient balance for scheduled transfer (pre-authorization check)
  const availableBalance = fromAccount.balance + (fromAccount.overdraftLimit || 0);
  if (totalAmount > availableBalance) {
    return NextResponse.json(
      {
        success: false,
        message: `Insufficient funds for scheduled transfer. Available: $${availableBalance.toFixed(2)}`,
        data: { availableBalance }
      },
      { status: 400 }
    );
  }

  // Check daily/monthly limits for scheduled date
  const scheduledDate = new Date(scheduledFor);
  scheduledDate.setHours(0, 0, 0, 0);

  const dayAfterScheduled = new Date(scheduledDate);
  dayAfterScheduled.setDate(scheduledDate.getDate() + 1);

  // Check daily limit for scheduled date
  const scheduledTransfersOnDate = await prisma.transaction.aggregate({
    where: {
      accountId: fromAccount.id,
      scheduledFor: {
        gte: scheduledDate,
        lt: dayAfterScheduled
      },
      transactionType: { type: TransactionTypes.TRANSFER },
      transactionStatus: { status: 'scheduled' }
    },
    _sum: { amount: true },
  });

  const dailyTotal = Math.abs(scheduledTransfersOnDate._sum.amount || 0);
  if (dailyTotal + amount > 10000) {
    return NextResponse.json(
      { success: false, message: 'Daily transfer limit exceeded for scheduled date ($10,000)' },
      { status: 400 }
    );
  }

  // Check account type limits for scheduled month
  if (fromAccount.accountType.type === 'savings') {
    const scheduledMonthStart = new Date(scheduledFor.getFullYear(), scheduledFor.getMonth(), 1);
    const nextMonthStart = new Date(scheduledFor.getFullYear(), scheduledFor.getMonth() + 1, 1);

    const scheduledMonthlyWithdrawals = await prisma.transaction.count({
      where: {
        accountId: fromAccount.id,
        scheduledFor: {
          gte: scheduledMonthStart,
          lt: nextMonthStart
        },
        transactionType: { type: { in: [TransactionTypes.TRANSFER, TransactionTypes.WITHDRAWAL] } },
        transactionStatus: { status: 'scheduled' }
      },
    });

    if (scheduledMonthlyWithdrawals >= (fromAccount.monthlyWithdrawalLimit || 6)) {
      return NextResponse.json(
        { success: false, message: 'Monthly withdrawal limit exceeded for savings account on scheduled date' },
        { status: 400 }
      );
    }
  }

  // Check transaction limit
  if (fromAccount.transactionLimit && amount > fromAccount.transactionLimit) {
    return NextResponse.json(
      {
        success: false,
        message: `Amount exceeds transaction limit of $${fromAccount.transactionLimit}`,
        data: { transactionLimit: fromAccount.transactionLimit }
      },
      { status: 400 }
    );
  }

  // Check if scheduled transfer needs approval (same as immediate transfers)
  const needsApproval = amount > 5000;

  // Get transaction type and status
  const transactionType = await prisma.transactionType.findUnique({
    where: { type: TransactionTypes.TRANSFER }
  });

  const scheduledStatus = await prisma.transactionStatus.findUnique({
    where: { status: 'scheduled' }
  });

  if (!transactionType || !scheduledStatus) {
    return NextResponse.json(
      { success: false, message: 'System configuration error' },
      { status: 500 }
    );
  }

  // Process scheduled transfer creation
  const result = await prisma.$transaction(async (tx) => {
    const referenceNumber = generateReferenceNumber(TransactionTypes.TRANSFER);

    // Create source transaction (scheduled)
    const fromTransaction = await tx.transaction.create({
      data: {
        accountId: fromAccount.id,
        userId: user.userId,
        transactionTypeId: transactionType.id,
        transactionStatusId: scheduledStatus.id,
        amount: -totalAmount,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        referenceNumber: `${referenceNumber}-OUT`,
        scheduledFor: scheduledFor,
        isScheduled: true,
      },
    });

    // Create destination transaction (scheduled)
    const toTransaction = await tx.transaction.create({
      data: {
        accountId: toAccount.id,
        userId: toAccount.customerId,
        transactionTypeId: transactionType.id,
        transactionStatusId: scheduledStatus.id,
        amount: amount,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        referenceNumber: `${referenceNumber}-IN`,
        scheduledFor: scheduledFor,
        isScheduled: true,
      },
    });

    // Create account transaction records with unchanged balances
    await tx.accountTransaction.create({
      data: {
        balanceBefore: fromAccount.balance,
        balanceAfter: fromAccount.balance, // Balance unchanged until execution
        accountId: fromAccount.id,
        transactionId: fromTransaction.id,
      },
    });

    await tx.accountTransaction.create({
      data: {
        balanceBefore: toAccount.balance,
        balanceAfter: toAccount.balance, // Balance unchanged until execution
        accountId: toAccount.id,
        transactionId: toTransaction.id,
      },
    });

    // Create fee transaction if applicable (scheduled)
    if (fee > 0) {
      const feeType = await tx.transactionType.findUnique({
        where: { type: 'fee' }
      });

      if (feeType) {
        await tx.transaction.create({
          data: {
            accountId: fromAccount.id,
            userId: user.userId,
            transactionTypeId: feeType.id,
            transactionStatusId: scheduledStatus.id,
            amount: -fee,
            referenceNumber: `${referenceNumber}-FEE`,
            scheduledFor: scheduledFor,
            isScheduled: true,
          },
        });
      }
    }

    // Create approval if needed for scheduled transfer
    if (needsApproval) {
      const approverRole = await tx.approverRole.findFirst({
        where: { role: 'manager' },
      });

      const pendingStatus = await tx.approvalStatus.findUnique({
        where: { status: 'pending' }
      });

      if (approverRole && pendingStatus) {
        await tx.approval.create({
          data: {
            transactionId: fromTransaction.id,
            approverId: user.userId,
            approverRoleId: approverRole.id,
            approverLimit: 5000,
            comments: `Scheduled transfer of $${amount.toFixed(2)} requires approval`,
            statusId: pendingStatus.id,
          },
        });
      }
    }

    // Create notifications
    await tx.notification.create({
      data: {
        userId: fromAccount.customerId,
        title: 'Scheduled Transfer Created',
        message: `Transfer of $${amount.toFixed(2)} scheduled for ${scheduledFor.toLocaleDateString()}`,
        type: 'TRANSACTION',
      },
    });

    await tx.notification.create({
      data: {
        userId: toAccount.customerId,
        title: 'Scheduled Transfer Pending',
        message: `Scheduled transfer of $${amount.toFixed(2)} from ${fromAccount.accountNumber} will arrive on ${scheduledFor.toLocaleDateString()}`,
        type: 'TRANSACTION',
      },
    });

    return {
      transaction: fromTransaction,
      referenceNumber,
      fee,
      isScheduled: true,
      scheduledFor,
      needsApproval,
    };
  });

  const response: ApiResponse = {
    success: true,
    message: result.needsApproval
      ? 'Scheduled transfer created and submitted for approval'
      : 'Scheduled transfer created successfully',
    data: {
      transaction: result.transaction,
      referenceNumber: result.referenceNumber,
      fee: result.fee,
      isScheduled: true,
      scheduledFor: result.scheduledFor,
      needsApproval: result.needsApproval,
    },
  };

  return NextResponse.json(response);
}

// Helper function for immediate transfers (your existing logic with minor fixes)
async function handleImmediateTransfer({
  user,
  fromAccount,
  toAccount,
  amount,
  fee
}: {
  user: any;
  fromAccount: any;
  toAccount: any;
  amount: number;
  description?: string;
  fee: number;
}) {
  const totalAmount = amount + fee;

  // Check daily/monthly limits
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTransfers = await prisma.transaction.aggregate({
    where: {
      accountId: fromAccount.id,
      createdAt: { gte: today },
      transactionType: { type: TransactionTypes.TRANSFER },
    },
    _sum: { amount: true },
  });

  const dailyTotal = Math.abs(todayTransfers._sum.amount || 0);
  if (dailyTotal + amount > 10000) {
    return NextResponse.json(
      { success: false, message: 'Daily transfer limit exceeded ($10,000)' },
      { status: 400 }
    );
  }

  // Check account type limits
  if (fromAccount.accountType.type === 'savings') {
    const monthlyWithdrawals = await prisma.transaction.count({
      where: {
        accountId: fromAccount.id,
        createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        transactionType: { type: { in: [TransactionTypes.TRANSFER, TransactionTypes.WITHDRAWAL] } },
      },
    });

    if (monthlyWithdrawals >= (fromAccount.monthlyWithdrawalLimit || 6)) {
      return NextResponse.json(
        { success: false, message: 'Monthly withdrawal limit exceeded for savings account' },
        { status: 400 }
      );
    }
  }

  // Check sufficient balance (including overdraft)
  const availableBalance = fromAccount.balance + (fromAccount.overdraftLimit || 0);
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

  // Check transaction limit
  if (fromAccount.transactionLimit && amount > fromAccount.transactionLimit) {
    return NextResponse.json(
      {
        success: false,
        message: `Amount exceeds transaction limit of $${fromAccount.transactionLimit}`,
        data: { transactionLimit: fromAccount.transactionLimit }
      },
      { status: 400 }
    );
  }

  // Check if transfer needs approval
  const needsApproval = amount > 5000;
  const transactionStatus = needsApproval ? 'pending' : 'completed';

  // Get transaction type and status
  const transactionType = await prisma.transactionType.findUnique({
    where: { type: TransactionTypes.TRANSFER }
  });

  const statusRecord = await prisma.transactionStatus.findUnique({
    where: { status: transactionStatus }
  });

  if (!transactionType || !statusRecord) {
    return NextResponse.json(
      { success: false, message: 'System configuration error' },
      { status: 500 }
    );
  }

  // Process transfer
  const result = await prisma.$transaction(async (tx) => {
    // Update source account balance
    const updatedFromAccount = await tx.account.update({
      where: { id: fromAccount.id },
      data: {
        balance: { decrement: totalAmount },
        updatedAt: new Date(),
      },
    });

    // Update destination account balance
    const updatedToAccount = await tx.account.update({
      where: { id: toAccount.id },
      data: {
        balance: { increment: amount },
        updatedAt: new Date(),
      },
    });

    const referenceNumber = generateReferenceNumber(TransactionTypes.TRANSFER);

    // Create source transaction
    const fromTransaction = await tx.transaction.create({
      data: {
        accountId: fromAccount.id,
        userId: user.userId,
        transactionTypeId: transactionType.id,
        transactionStatusId: statusRecord.id,
        amount: -totalAmount, // Negative for outgoing
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        referenceNumber: `${referenceNumber}-OUT`,
        isScheduled: false,
      },
    });

    // Create destination transaction
    const toTransaction = await tx.transaction.create({
      data: {
        accountId: toAccount.id,
        userId: toAccount.customerId,
        transactionTypeId: transactionType.id,
        transactionStatusId: statusRecord.id,
        amount: amount, // Positive for incoming
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        referenceNumber: `${referenceNumber}-IN`,
        isScheduled: false,
      },
    });

    // Create account transaction records
    await tx.accountTransaction.create({
      data: {
        balanceBefore: fromAccount.balance,
        balanceAfter: updatedFromAccount.balance,
        accountId: fromAccount.id,
        transactionId: fromTransaction.id,
      },
    });

    await tx.accountTransaction.create({
      data: {
        balanceBefore: toAccount.balance,
        balanceAfter: updatedToAccount.balance,
        accountId: toAccount.id,
        transactionId: toTransaction.id,
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
            accountId: fromAccount.id,
            userId: user.userId,
            transactionTypeId: feeType.id,
            transactionStatusId: statusRecord.id,
            amount: -fee,
            referenceNumber: `${referenceNumber}-FEE`,
            isScheduled: false,
          },
        });
      }
    }

    // Create approval if needed
    if (needsApproval) {
      const approverRole = await tx.approverRole.findFirst({
        where: { role: 'manager' },
      });

      const pendingStatus = await tx.approvalStatus.findUnique({
        where: { status: 'pending' }
      });

      if (approverRole && pendingStatus) {
        await tx.approval.create({
          data: {
            transactionId: fromTransaction.id,
            approverId: user.userId,
            approverRoleId: approverRole.id,
            approverLimit: 5000,
            comments: `Transfer of $${amount.toFixed(2)} requires approval`,
            statusId: pendingStatus.id,
          },
        });
      }
    }

    // Create notifications
    await tx.notification.create({
      data: {
        userId: fromAccount.customerId,
        title: needsApproval ? 'Transfer Submitted' : 'Transfer Sent',
        message: needsApproval
          ? `Transfer of $${amount.toFixed(2)} submitted for approval`
          : `Transfer of $${amount.toFixed(2)} sent to ${toAccount.accountNumber}`,
        type: 'TRANSACTION',
      },
    });

    if (!needsApproval) {
      await tx.notification.create({
        data: {
          userId: toAccount.customerId,
          title: 'Transfer Received',
          message: `Received $${amount.toFixed(2)} from ${fromAccount.accountNumber}`,
          type: 'TRANSACTION',
        },
      });
    }

    return {
      transaction: fromTransaction,
      referenceNumber,
      fee,
      needsApproval,
      newBalance: updatedFromAccount.balance,
    };
  });

  const response: ApiResponse = {
    success: true,
    message: result.needsApproval
      ? 'Transfer submitted for approval'
      : 'Transfer completed successfully',
    data: {
      transaction: result.transaction,
      referenceNumber: result.referenceNumber,
      fee: result.fee,
      needsApproval: result.needsApproval,
      newBalance: result.newBalance,
    },
  };

  return NextResponse.json(response);
}