// Base API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

// Generic API response type for TypeScript inference
export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  errors?: never;
};

export type ApiFailure = {
  success: false;
  message: string;
  errors?: ApiError[];
  data?: never;
};

// Type guard functions
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return response.success === true;
}

export function isApiFailure<T>(response: ApiResponse<T>): response is ApiFailure {
  return response.success === false;
}

export interface TransferResponse {
  transaction: {
    id: number;
    referenceNumber: string;
    amount: number;
    description: string | null;
    createdAt: string;
  };
  referenceNumber: string;
  fee: number;
  needsApproval: boolean; // Add this property
  newBalance: number;
}

export const endpoints = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: '/api/auth/logout',
  },
  admin: {
    users: '/api/admin/users',
    accounts: '/api/admin/accounts',
    approvals: '/api/admin/approvals',
    reports: '/api/admin/reports',
  },
  customer: {
    accounts: '/api/accounts',
    accountsCreate: '/api/accounts/create',
    accountDetail: (id: number) => `/api/accounts/${id}`,
    accountTransactions: (id: number) => `/api/accounts/${id}/transactions`,
    // Loan specific
    loanApplications: '/api/loans/applications',
    loanCalculator: '/api/loans/calculator',
  },
  transactions: {
    transfer: '/api/transactions/transfer',
    deposit: '/api/transactions/deposit',
    withdrawal: '/api/transactions/withdrawal',
    payment: '/api/transactions/payment',
    history: '/api/transactions/history',
  },
}