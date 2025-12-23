// app/api/accounts/create/route.ts - UPDATED WITH ZOD VALIDATION
import { requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { AccountCreationSchema, AccountTypes, calculateMonthlyPayment, LoanAccountData } from '@/validation/account';
import { formatZodError } from '@/validation/auth';
import { NextRequest, NextResponse } from 'next/server';

// Generate unique account number
function generateAccountNumber(accountType: string): string {
  const prefixes: Record<string, string> = {
    [AccountTypes.SAVINGS]: 'SAV',
    [AccountTypes.CHECKING]: 'CHK',
    [AccountTypes.LOAN]: 'LON'
  };
  const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  const checkDigit = Math.floor(Math.random() * 10);
  return `${prefixes[accountType] || 'ACC'}${random}${checkDigit}`;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only customers can create accounts
    const user = await requireRole(['CUSTOMER']);
    
    const body = await request.json();
    
    // Validate input using Zod
    const validationResult = AccountCreationSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = formatZodError(validationResult.error)
      
      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        errors
      };
      
      return NextResponse.json(response, { status: 400 });
    }
    
    const data = validationResult.data;
    const { accountType } = data;
    
    // Get account type and status IDs
    const accountTypeRecord = await prisma.accountType.findUnique({
      where: { type: accountType }
    });
    
    const accountStatus = await prisma.accountStatus.findUnique({
      where: { status: 'active' }
    });
    
    if (!accountTypeRecord || !accountStatus) {
      const response: ApiResponse = {
        success: false,
        message: 'System configuration error'
      };
      return NextResponse.json(response, { status: 500 });
    }

    // Prepare account data based on type
    const accountData: any = {
      accountNumber: generateAccountNumber(accountType),
      customerId: user.userId,
      accountTypeId: accountTypeRecord.id,
      accountStatusId: accountStatus.id,
    };

    // Handle different account types
    let transactionTypeName = 'deposit';
    let transactionAmount = 0;
    
    if (accountType === AccountTypes.SAVINGS) {
      const savingsData = data; // TypeScript knows this is SavingsAccountData
      accountData.balance = savingsData.initialDeposit;
      accountData.minimumBalance = 0;
      accountData.transactionLimit = 5000;
      accountData.interestRate = savingsData.interestRate || 1.5;
      accountData.monthlyWithdrawalLimit = 6;
      accountData.overdraftLimit = 0;
      transactionAmount = savingsData.initialDeposit;
      
    } else if (accountType === AccountTypes.CHECKING) {
      const checkingData = data; // TypeScript knows this is CheckingAccountData
      accountData.balance = checkingData.initialDeposit;
      accountData.minimumBalance = 50;
      accountData.transactionLimit = null;
      accountData.interestRate = 0.1;
      accountData.monthlyWithdrawalLimit = null;
      accountData.overdraftLimit = checkingData.overdraftProtection ? 500 : 0;
      transactionAmount = checkingData.initialDeposit;
      
    } else if (accountType === AccountTypes.LOAN) {
      const loanData = data; // TypeScript knows this is LoanAccountData
      transactionTypeName = 'loan_disbursement';
      transactionAmount = loanData.loanAmount;
      
      // Calculate monthly payment
      const monthlyPayment = calculateMonthlyPayment(
        loanData.loanAmount,
        loanData.interestRate,
        loanData.loanTerm
      );
      
      // Loan accounts have negative balance
      accountData.balance = -loanData.loanAmount;
      accountData.loanAmount = loanData.loanAmount;
      accountData.interestRate = loanData.interestRate;
      accountData.monthlyPayment = monthlyPayment;
      accountData.minimumPayment = monthlyPayment;
      accountData.dueDate = new Date();
      accountData.dueDate.setMonth(accountData.dueDate.getMonth() + 1);
      accountData.overdraftLimit = 0;
    }

    // Create account and transaction
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: accountData,
      });

      // Create initial transaction
      const transactionType = await tx.transactionType.findUnique({
        where: { type: transactionTypeName }
      });
      
      const transactionStatus = await tx.transactionStatus.findUnique({
        where: { status: 'completed' }
      });
      
      let transaction = null;
      
      if (transactionType && transactionStatus && transactionAmount > 0) {
        transaction = await tx.transaction.create({
          data: {
            accountId: account.id,
            userId: user.userId,
            transactionTypeId: transactionType.id,
            transactionStatusId: transactionStatus.id,
            amount: transactionAmount,
            referenceNumber: `${transactionTypeName.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        });
        
        // Create account transaction record
        await tx.accountTransaction.create({
          data: {
            balanceBefore: 0,
            balanceAfter: accountData.balance,
            accountId: account.id,
            transactionId: transaction.id,
          },
        });
      }

      return { account, transaction };
    });

    // Create notification
    const notificationTitle = 'Account Opened Successfully';
    let notificationMessage = '';
    
    if (accountType === AccountTypes.LOAN) {
      const loanData = data as LoanAccountData;
      notificationMessage = `Your loan account (${result.account.accountNumber}) has been approved. Loan amount: $${loanData.loanAmount.toFixed(2)}. Monthly payment: $${(accountData.monthlyPayment as number).toFixed(2)}`;
    } else {
      const depositData = data as { initialDeposit: number };
      notificationMessage = `Your new ${accountType} account (${result.account.accountNumber}) has been opened with an initial deposit of $${depositData.initialDeposit.toFixed(2)}`;
    }
    
    await prisma.notification.create({
      data: {
        userId: user.userId,
        title: notificationTitle,
        message: notificationMessage,
        type: 'ACCOUNT',
      },
    });

    // Prepare response
    const responseData = {
      account: {
        id: result.account.id,
        accountNumber: result.account.accountNumber,
        accountType: accountType,
        balance: result.account.balance,
        status: 'active',
        createdAt: result.account.createdAt.toISOString(),
        ...(accountType === AccountTypes.LOAN && {
          monthlyPayment: accountData.monthlyPayment,
          dueDate: accountData.dueDate?.toISOString()
        })
      },
      transaction: result.transaction ? {
        referenceNumber: result.transaction.referenceNumber,
        amount: result.transaction.amount,
        type: transactionTypeName
      } : undefined
    };

    const response: ApiResponse<typeof responseData> = {
      success: true,
      message: `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} account created successfully`,
      data: responseData
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Account creation error:', error);
    
    if (error.name === 'AuthError') {
      const response: ApiResponse = {
        success: false,
        message: 'Authentication required'
      };
      return NextResponse.json(response, { status: 401 });
    }
    
    const response: ApiResponse = {
      success: false,
      message: error.message || 'Failed to create account'
    };
    return NextResponse.json(response, { status: 500 });
  }
}