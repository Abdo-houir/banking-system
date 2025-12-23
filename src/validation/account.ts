// types/account.ts - Account creation types and validation
import { z } from 'zod';

// Base account types
export const AccountTypes = {
  SAVINGS: 'savings',
  CHECKING: 'checking', 
  LOAN: 'loan'
} as const;

export type AccountType = typeof AccountTypes[keyof typeof AccountTypes];

// Account creation schemas
export const SavingsAccountSchema = z.object({
  accountType: z.literal(AccountTypes.SAVINGS),
  initialDeposit: z.number()
    .min(25, { message: 'Minimum opening deposit for savings is $25' })
    .max(100000, { message: 'Maximum initial deposit is $100,000' }),
  accountName: z.string()
    .min(2, { message: 'Account name must be at least 2 characters' })
    .max(50, { message: 'Account name cannot exceed 50 characters' }),
  monthlyStatements: z.enum(['electronic', 'paper']).default('electronic'),
  // Savings specific
  interestRate: z.number()
    .min(0.01, { message: 'Interest rate must be at least 0.01%' })
    .max(10, { message: 'Interest rate cannot exceed 10%' })
    .optional()
    .default(1.5),
});

export const CheckingAccountSchema = z.object({
  accountType: z.literal(AccountTypes.CHECKING),
  initialDeposit: z.number()
    .min(50, { message: 'Minimum opening deposit for checking is $50' })
    .max(100000, { message: 'Maximum initial deposit is $100,000' }),
  accountName: z.string()
    .min(2, { message: 'Account name must be at least 2 characters' })
    .max(50, { message: 'Account name cannot exceed 50 characters' }),
  monthlyStatements: z.enum(['electronic', 'paper']).default('electronic'),
  // Checking specific
  overdraftProtection: z.boolean().default(true),
  debitCard: z.boolean().default(true),
});

export const LoanAccountSchema = z.object({
  accountType: z.literal(AccountTypes.LOAN),
  loanAmount: z.number()
    .min(1000, { message: 'Minimum loan amount is $1,000' })
    .max(500000, { message: 'Maximum loan amount is $500,000' }),
  loanTerm: z.number()
    .min(1, { message: 'Minimum loan term is 1 year' })
    .max(30, { message: 'Maximum loan term is 30 years' }),
  interestRate: z.number()
    .min(1, { message: 'Minimum interest rate is 1%' })
    .max(25, { message: 'Maximum interest rate is 25%' }),
  purpose: z.string()
    .min(5, { message: 'Please describe the loan purpose' })
    .max(200, { message: 'Loan purpose cannot exceed 200 characters' }),
  // Optional fields
  collateralDescription: z.string().optional(),
  employmentStatus: z.enum(['employed', 'self-employed', 'unemployed', 'retired']).default('employed'),
  monthlyIncome: z.number().optional(),
});

// Union schema for account creation
export const AccountCreationSchema = z.discriminatedUnion('accountType', [
  SavingsAccountSchema,
  CheckingAccountSchema,
  LoanAccountSchema
]);

// Type inference
export type SavingsAccountData = z.infer<typeof SavingsAccountSchema>;
export type CheckingAccountData = z.infer<typeof CheckingAccountSchema>;
export type LoanAccountData = z.infer<typeof LoanAccountSchema>;
export type AccountCreationData = z.infer<typeof AccountCreationSchema>;

// API response types for account creation
export interface AccountCreationResponse {
  account: {
    id: number;
    accountNumber: string;
    accountType: AccountType;
    balance: number;
    status: string;
    createdAt: string;
    // Loan specific
    monthlyPayment?: number;
    dueDate?: string;
  };
  transaction?: {
    referenceNumber: string;
    amount: number;
    type: string;
  };
}


// Type guard for specific account types
export function isSavingsAccount(data: AccountCreationData): data is SavingsAccountData {
  return data.accountType === AccountTypes.SAVINGS;
}

export function isCheckingAccount(data: AccountCreationData): data is CheckingAccountData {
  return data.accountType === AccountTypes.CHECKING;
}

export function isLoanAccount(data: AccountCreationData): data is LoanAccountData {
  return data.accountType === AccountTypes.LOAN;
}

// Helper to get account type display name
export function getAccountTypeDisplay(type: AccountType): string {
  const displayNames: Record<AccountType, string> = {
    [AccountTypes.SAVINGS]: 'Savings Account',
    [AccountTypes.CHECKING]: 'Checking Account',
    [AccountTypes.LOAN]: 'Loan Account'
  };
  return displayNames[type];
}

// Helper to get minimum deposit by account type
export function getMinimumDeposit(type: AccountType): number {
  const minimums: Record<AccountType, number> = {
    [AccountTypes.SAVINGS]: 25,
    [AccountTypes.CHECKING]: 50,
    [AccountTypes.LOAN]: 0 // Loans don't require deposit
  };
  return minimums[type];
}

// Helper to calculate monthly loan payment
export function calculateMonthlyPayment(
  principal: number, 
  annualRate: number, 
  termYears: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = termYears * 12;
  
  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }
  
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
         (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
}