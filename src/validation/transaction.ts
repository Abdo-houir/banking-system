// validation/transaction.ts
import { z } from 'zod';

// Transaction type constants
export const TransactionTypes = {
  TRANSFER: 'transfer',
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  PAYMENT: 'payment',
  LOAN_DISBURSEMENT: 'loan_disbursement',
  LOAN_PAYMENT: 'loan_payment'
} as const;

export type TransactionType = typeof TransactionTypes[keyof typeof TransactionTypes];

// Transaction status constants
export const TransactionStatuses = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  APPROVAL_REQUIRED: 'approval_required'
} as const;

export type TransactionStatus = typeof TransactionStatuses[keyof typeof TransactionStatuses];

// Base transaction schema
export const BaseTransactionSchema = z.object({
  accountId: z.string().min(1, { message: 'Account ID is required' }),
  amount: z.number()
    .positive({ message: 'Amount must be positive' })
    .max(1000000, { message: 'Maximum transaction amount is $1,000,000' }),
  description: z.string()
    .min(1, { message: 'Description is required' })
    .max(500, { message: 'Description cannot exceed 500 characters' }),
  reference: z.string().optional(),
});

// Transfer schema
export const TransferSchema = BaseTransactionSchema.extend({
  fromAccountId: z.string().min(1, { message: 'Source account is required' }),
  toAccountNumber: z.string()
    .min(1, { message: 'Destination account number is required' })
    .regex(/^[A-Z0-9]{8,15}$/, { message: 'Invalid account number format' }),
  scheduleDate: z.string().optional(), // ISO string for scheduled transfers
  isScheduled: z.boolean().default(false),
  scheduledFor:
    z.preprocess((val) => (typeof val === "string" ? new Date(val) : val),
      z.date()
        .optional()
        .refine((date) => {
          if (!date) return true; // Optional for non-scheduled transfers
          const now = new Date();
          const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Minimum 24 hours from now
          const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // Maximum 1 year from now
          return date >= minDate && date <= maxDate;
        }, {
          message: 'Scheduled date must be between 24 hours and 1 year from now'
        })
        .transform(date => date ? new Date(date) : undefined)),
}).refine(data => data.fromAccountId !== data.toAccountNumber, {
  message: 'Cannot transfer to the same account',
  path: ['toAccountNumber'],
}).refine((data) => {
  // If isScheduled is true, scheduledFor must be provided
  if (data.isScheduled && !data.scheduledFor) {
    return false;
  }
  return true;
}, {
  message: 'Scheduled date is required for scheduled transfers',
  path: ['scheduledFor']
});

export type TransferData = z.infer<typeof TransferSchema>;

// Deposit schema
export const DepositSchema = BaseTransactionSchema.extend({
  depositMethod: z.enum(['cash', 'check', 'ach', 'wire']),
  checkNumber: z.string().optional(),
  branchId: z.string().optional(),
  tellerId: z.string().optional(),
}).refine(data => {
  if (data.depositMethod === 'check' && !data.checkNumber) {
    return false;
  }
  return true;
}, {
  message: 'Check number is required for check deposits',
  path: ['checkNumber'],
});

export type DepositData = z.infer<typeof DepositSchema>;

// Withdrawal schema
export const WithdrawalSchema = BaseTransactionSchema.extend({
  withdrawalMethod: z.enum(['cash', 'check', 'transfer']),
  branchId: z.string().optional(),
  tellerId: z.string().optional(),
  recipientAccount: z.string().optional(),
  pin: z.string().min(4, { message: 'PIN must be at least 4 digits' }).max(6, { message: 'PIN cannot exceed 6 digits' }),
}).refine(data => {
  if (data.withdrawalMethod === 'transfer' && !data.recipientAccount) {
    return false;
  }
  return true;
}, {
  message: 'Recipient account is required for transfers',
  path: ['recipientAccount'],
});

export type WithdrawalData = z.infer<typeof WithdrawalSchema>;

// Bill payment schema
export const PaymentSchema = BaseTransactionSchema.extend({
  payeeName: z.string()
    .min(2, { message: 'Payee name is required' })
    .max(100, { message: 'Payee name cannot exceed 100 characters' }),
  payeeAccount: z.string()
    .min(1, { message: 'Payee account is required' })
    .max(50, { message: 'Payee account cannot exceed 50 characters' }),
  billType: z.enum(['utility', 'credit_card', 'loan', 'mortgage', 'insurance', 'other']),
  dueDate: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(['monthly', 'quarterly', 'annually']).optional(),
  scheduleDate: z.string().optional(),
}).refine(data => {
  if (data.isRecurring && !data.recurringFrequency) {
    return false;
  }
  return true;
}, {
  message: 'Recurring frequency is required for recurring payments',
  path: ['recurringFrequency'],
});

export type PaymentData = z.infer<typeof PaymentSchema>;

// Transaction history query schema
export const TransactionHistorySchema = z.object({
  accountId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type TransactionHistoryQuery = z.infer<typeof TransactionHistorySchema>;

// Transaction response types
export interface TransactionResponse {
  id: number;
  referenceNumber: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  accountNumber: string;
  createdAt: string;
  balanceAfter: number;
  // For transfers
  toAccountNumber?: string;
  fromAccountNumber?: string;
  // For payments
  payeeName?: string;
}


// Helper functions
export function generateReferenceNumber(type: TransactionType): string {
  const prefixMap: Record<TransactionType, string> = {
    [TransactionTypes.TRANSFER]: 'TRF',
    [TransactionTypes.DEPOSIT]: 'DEP',
    [TransactionTypes.WITHDRAWAL]: 'WDL',
    [TransactionTypes.PAYMENT]: 'PAY',
    [TransactionTypes.LOAN_DISBURSEMENT]: 'LND',
    [TransactionTypes.LOAN_PAYMENT]: 'LNP',
  };

  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `${prefixMap[type]}-${timestamp}-${random}`;
}

export function calculateTransactionFee(
  amount: number,
  type: TransactionType,
  accountType?: string
): number {
  let fee = 0;

  switch (type) {
    case TransactionTypes.TRANSFER:
      // Free for internal transfers, $2 for external
      fee = 2.00;
      break;
    case TransactionTypes.WITHDRAWAL:
      // $3 for withdrawals
      fee = 3.00;
      break;
    case TransactionTypes.PAYMENT:
      // $1 for bill payments
      fee = 1.00;
      break;
    default:
      fee = 0;
  }

  // Premium accounts get fee waivers
  if (accountType === 'premium') {
    fee = 0;
  }

  return fee;
}

// Import ApiSuccess and ApiFailure from your types

