import { z } from 'zod';

// ... existing schemas ...

// Employee management schema (for creating/updating tellers/managers)
export const employeeSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .min(1, { message: 'Email is required' })
    .transform((email) => email.toLowerCase().trim()),
  
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    })
    .optional()
    .or(z.literal('')),
  
  firstName: z
    .string()
    .min(1, { message: 'First name is required' })
    .max(50, { message: 'First name cannot exceed 50 characters' })
    .regex(/^[a-zA-Z\s]*$/, { message: 'First name can only contain letters and spaces' }),
  
  lastName: z
    .string()
    .min(1, { message: 'Last name is required' })
    .max(50, { message: 'Last name cannot exceed 50 characters' })
    .regex(/^[a-zA-Z\s]*$/, { message: 'Last name can only contain letters and spaces' }),
  
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Please enter a valid phone number' })
    .optional()
    .or(z.literal('')),
  
  role: z
    .enum(['TELLER', 'MANAGER']),
  
  status: z
    .enum(['ACTIVE', 'BANNED'])
    .default('ACTIVE'),
});

export const AdminCustomerUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'First name is required' })
    .max(50, { message: 'First name cannot exceed 50 characters' })
    .regex(/^[a-zA-Z\s]*$/, { message: 'First name can only contain letters and spaces' })
    .optional(),
  
  lastName: z
    .string()
    .min(1, { message: 'Last name is required' })
    .max(50, { message: 'Last name cannot exceed 50 characters' })
    .regex(/^[a-zA-Z\s]*$/, { message: 'Last name can only contain letters and spaces' })
    .optional(),
  
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Please enter a valid phone number' })
    .optional()
    .or(z.literal('')),
  
  status: z
    .enum(['ACTIVE', 'BANNED'])
    .optional(),
});

export const adminAccountUpdateSchema = z.object({
  accountStatusId: z
    .number()
    .min(1, { message: 'Account status is required' })
    .optional(),
  
  transactionLimit: z
    .number()
    .min(0, { message: 'Transaction limit must be positive' })
    .optional(),
  
  minimumBalance: z
    .number()
    .min(0, { message: 'Minimum balance must be positive' })
    .optional(),
  
  overdraftLimit: z
    .number()
    .min(0, { message: 'Overdraft limit must be positive' })
    .optional(),
  
  monthlyWithdrawalLimit: z
    .number()
    .int()
    .min(0, { message: 'Monthly withdrawal limit must be positive' })
    .optional(),
  
  interestRate: z
    .number()
    .min(0, { message: 'Interest rate must be positive' })
    .max(100, { message: 'Interest rate cannot exceed 100%' })
    .optional(),
  
  loanAmount: z
    .number()
    .min(0, { message: 'Loan amount must be positive' })
    .optional(),
  
  monthlyPayment: z
    .number()
    .min(0, { message: 'Monthly payment must be positive' })
    .optional(),
  
  minimumPayment: z
    .number()
    .min(0, { message: 'Minimum payment must be positive' })
    .optional(),
  
  dueDate: z
    .string()
    .datetime()
    .optional()
    .or(z.null()),
});


// Account search/filter schema
export const adminAccountFilterSchema = z.object({
  search: z.string().optional(),
  accountType: z.string().optional(),
  accountStatus: z.string().optional(),
  minBalance: z.number().optional(),
  maxBalance: z.number().optional(),
  customerId: z.number().optional(),
});


// Account statement schema
export const adminAccountStatementSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
export type AdminCustomerUpdateInput = z.infer<typeof AdminCustomerUpdateSchema>;
export type AdminAccountUpdateInput = z.infer<typeof adminAccountUpdateSchema>;
export type AdminAccountFilterInput = z.infer<typeof adminAccountFilterSchema>;
export type AdminAccountStatementInput = z.infer<typeof adminAccountStatementSchema>;
