import { UserRole, UserStatus } from "@/generated/prisma/enums";

export interface Employee {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    accounts: number;
    transactions: number;
    approvals: number;
  };
}

interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: 'ACTIVE' | 'BANNED';
  createdAt: Date;
  updatedAt: Date;
  _count: {
    accounts: number;
    transactions: number;
    notifications: number;
  };
}

interface Account {
  id: number;
  accountNumber: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
  transactionLimit: number | null;
  minimumBalance: number | null;
  interestRate: number | null;
  loanAmount: number | null;
  monthlyPayment: number | null;
  overdraftLimit: number | null;
  monthlyWithdrawalLimit: number | null;
  minimumPayment: number | null;
  dueDate: Date | null
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    status: string;
  };
  accountType: {
    id: number;
    type: string;
  };
  accountStatus: {
    id: number;
    status: string;
  };
  _count: {
    transactions: number;
  };
}

export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EmployeesResponse {
  employees: Employee[];
  pagination: PaginationInfo;
}