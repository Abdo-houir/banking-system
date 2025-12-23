'use server';

import prisma from '@/lib/prisma';
import { AdminAccountUpdateInput, adminAccountUpdateSchema } from '@/validation/admin';
import { revalidatePath } from 'next/cache';

// Get all accounts with filters
export async function getAccounts(params?: {
    search?: string;
    accountType?: string;
    accountStatus?: string;
    minBalance?: number;
    maxBalance?: number;
    customerId?: number;
    page?: number;
    pageSize?: number;
}) {
    try {
        const {
            search = '',
            accountType = '',
            accountStatus = '',
            minBalance,
            maxBalance,
            customerId,
            page = 1,
            pageSize = 5,
        } = params || {};

        const skip = (page - 1) * pageSize;

        // Build where clause
        const where: any = {};

        // Add search filters
        if (search) {
            where.OR = [
                { accountNumber: { contains: search, mode: 'insensitive' } },
                {
                    customer: {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                        ]
                    }
                },
            ];
        }

        // Filter by account type
        if (accountType) {
            where.accountType = {
                type: accountType
            };
        }

        // Filter by account status
        if (accountStatus) {
            where.accountStatus = {
                status: accountStatus
            };
        }

        // Filter by customer
        if (customerId) {
            where.customerId = customerId;
        }

        // Filter by balance range
        if (minBalance !== undefined || maxBalance !== undefined) {
            where.balance = {};
            if (minBalance !== undefined) {
                where.balance.gte = minBalance;
            }
            if (maxBalance !== undefined) {
                where.balance.lte = maxBalance;
            }
        }

        // Get accounts with pagination
        const [accounts, total] = await Promise.all([
            prisma.account.findMany({
                where,
                select: {
                    id: true,
                    accountNumber: true,
                    balance: true,
                    createdAt: true,
                    updatedAt: true,
                    transactionLimit: true,
                    minimumBalance: true,
                    interestRate: true,
                    loanAmount: true,
                    monthlyPayment: true,
                    overdraftLimit: true,
                    monthlyWithdrawalLimit: true,
                    minimumPayment: true,
                    dueDate: true,
                    customer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            status: true,
                        },
                    },
                    accountType: {
                        select: {
                            id: true,
                            type: true,
                        },
                    },
                    accountStatus: {
                        select: {
                            id: true,
                            status: true,
                        },
                    },
                    _count: {
                        select: {
                            transactions: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            prisma.account.count({ where }),
        ]);

        return {
            success: true,
            data: {
                accounts,
                pagination: {
                    total,
                    page,
                    pageSize,
                    totalPages: Math.ceil(total / pageSize),
                },
            },
        };
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return {
            success: false,
            message: 'Failed to fetch accounts',
        };
    }
}

// Get single account by ID with full details
export async function getAccountById(id: number) {
    try {
        const account = await prisma.account.findUnique({
            where: { id },
            select: {
                id: true,
                accountNumber: true,
                balance: true,
                minimumBalance: true,
                transactionLimit: true,
                interestRate: true,
                minimumPayment: true,
                dueDate: true,
                monthlyWithdrawalLimit: true,
                overdraftLimit: true,
                loanAmount: true,
                monthlyPayment: true,
                createdAt: true,
                updatedAt: true,
                customer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        status: true,
                        createdAt: true,
                    },
                },
                accountType: {
                    select: {
                        id: true,
                        type: true,
                    },
                },
                accountStatus: {
                    select: {
                        id: true,
                        status: true,
                    },
                },
                transactions: {
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        amount: true,
                        referenceNumber: true,
                        createdAt: true,
                        transactionType: {
                            select: {
                                type: true,
                            },
                        },
                        transactionStatus: {
                            select: {
                                status: true,
                            },
                        },
                    },
                },
                accountTransactions: {
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        balanceBefore: true,
                        balanceAfter: true,
                        createdAt: true,
                        transaction: {
                            select: {
                                id: true,
                                amount: true,
                                referenceNumber: true,
                                transactionType: {
                                    select: {
                                        type: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!account) {
            return {
                success: false,
                message: 'Account not found',
            };
        }

        return {
            success: true,
            data: { account },
        };
    } catch (error) {
        console.error('Error fetching account:', error);
        return {
            success: false,
            message: 'Failed to fetch account',
        };
    }
}

// Update account
export async function updateAccount(id: number, data: AdminAccountUpdateInput) {
    try {
        // Validate input
        const validatedData = adminAccountUpdateSchema.parse(data);

        // Check if account exists
        const existingAccount = await prisma.account.findUnique({
            where: { id },
        });

        if (!existingAccount) {
            return {
                success: false,
                message: 'Account not found',
            };
        }

        // Update account
        const account = await prisma.account.update({
            where: { id },
            data: validatedData,
            select: {
                id: true,
                accountNumber: true,
                balance: true,
                createdAt: true,
                updatedAt: true,
                accountType: {
                    select: {
                        type: true,
                    },
                },
                accountStatus: {
                    select: {
                        status: true,
                    },
                },
            },
        });

        // Revalidate paths
        revalidatePath('/admin/accounts');
        revalidatePath('/admin/accounts', 'page');
        revalidatePath(`/admin/accounts/${id}`);

        return {
            success: true,
            message: 'Account updated successfully',
            data: { account },
        };
    } catch (error: any) {
        console.error('Error updating account:', error);

        if (error.name === 'ZodError') {
            return {
                success: false,
                message: 'Validation failed',
                errors: error.errors.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message,
                })),
            };
        }

        return {
            success: false,
            message: 'Failed to update account',
        };
    }
}

// Change account status
export async function changeAccountStatus(id: number, statusId: number) {
    try {
        const account = await prisma.account.findUnique({
            where: { id },
            include: {
                accountStatus: true,
            },
        });

        if (!account) {
            return {
                success: false,
                message: 'Account not found',
            };
        }

        // Check if status exists
        const status = await prisma.accountStatus.findUnique({
            where: { id: statusId },
        });

        if (!status) {
            return {
                success: false,
                message: 'Invalid account status',
            };
        }

        await prisma.account.update({
            where: { id },
            data: { accountStatusId: statusId },
        });

        // Revalidate paths
        revalidatePath('/admin/accounts');
        revalidatePath('/admin/accounts', 'page');
        revalidatePath(`/admin/accounts/${id}`);

        return {
            success: true,
            message: `Account status changed to ${status.status}`,
            data: { status: status.status },
        };
    } catch (error) {
        console.error('Error changing account status:', error);
        return {
            success: false,
            message: 'Failed to change account status',
        };
    }
}

// Get account statement
export async function getAccountStatement(id: number, startDate: Date, endDate: Date) {
    try {
        const account = await prisma.account.findUnique({
            where: { id },
            select: {
                id: true,
                accountNumber: true,
                balance: true,
                customer: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
                accountType: {
                    select: {
                        type: true,
                    },
                },
            },
        });

        if (!account) {
            return {
                success: false,
                message: 'Account not found',
            };
        }

        // Get transactions within date range
        const accountTransactions = await prisma.accountTransaction.findMany({
            where: {
                accountId: id,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                transaction: {
                    select: {
                        id: true,
                        amount: true,
                        referenceNumber: true,
                        createdAt: true,
                        transactionType: {
                            select: {
                                type: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate opening and closing balances
        const openingBalance = accountTransactions.length > 0
            ? accountTransactions[accountTransactions.length - 1].balanceBefore
            : account.balance;

        const closingBalance = accountTransactions.length > 0
            ? accountTransactions[0].balanceAfter
            : account.balance;

        // Calculate totals
        const deposits = accountTransactions
            .filter(at => at.transaction.transactionType.type === 'deposit')
            .reduce((sum, at) => sum + at.transaction.amount, 0);

        const withdrawals = accountTransactions
            .filter(at => at.transaction.transactionType.type === 'withdrawal')
            .reduce((sum, at) => sum + at.transaction.amount, 0);

        const transfers = accountTransactions
            .filter(at => at.transaction.transactionType.type === 'transfer')
            .reduce((sum, at) => sum + at.transaction.amount, 0);

        return {
            success: true,
            data: {
                account,
                statement: {
                    period: {
                        start: startDate,
                        end: endDate,
                    },
                    openingBalance,
                    closingBalance,
                    transactions: accountTransactions,
                    summary: {
                        totalDeposits: deposits,
                        totalWithdrawals: withdrawals,
                        totalTransfers: transfers,
                        netChange: closingBalance - openingBalance,
                    },
                },
            },
        };
    } catch (error) {
        console.error('Error fetching account statement:', error);
        return {
            success: false,
            message: 'Failed to fetch account statement',
        };
    }
}

// Get account statistics
export async function getAccountStats() {
    try {
        const [
            totalAccounts,
            activeAccounts,
            frozenAccounts,
            suspendedAccounts,
            closedAccounts,
            totalBalance,
            totalLoans,
            avgBalance,
            accountsByType,
        ] = await Promise.all([
            // Total accounts
            prisma.account.count(),

            // Active accounts
            prisma.account.count({
                where: {
                    accountStatus: {
                        status: 'active',
                    },
                },
            }),

            // Frozen accounts
            prisma.account.count({
                where: {
                    accountStatus: {
                        status: 'frozen',
                    },
                },
            }),

            // Suspended accounts
            prisma.account.count({
                where: {
                    accountStatus: {
                        status: 'suspended',
                    },
                },
            }),

            // Closed accounts
            prisma.account.count({
                where: {
                    accountStatus: {
                        status: 'closed',
                    },
                },
            }),

            // Total balance
            prisma.account.aggregate({
                _sum: { balance: true },
            }),

            // Total loans
            prisma.account.aggregate({
                where: {
                    accountType: {
                        type: 'loan',
                    },
                },
                _sum: { loanAmount: true },
            }),

            // Average balance
            prisma.account.aggregate({
                _avg: { balance: true },
            }),

            // Accounts by type
            prisma.account.groupBy({
                by: ['accountTypeId'],
                _count: true,
                _sum: {
                    balance: true,
                },
            }).then(async results => {
                const accountTypes = await prisma.accountType.findMany();
                return results.map(result => {
                    const type = accountTypes.find(t => t.id === result.accountTypeId);
                    return {
                        type: type?.type || 'Unknown',
                        count: result._count,
                        totalBalance: result._sum.balance || 0,
                    };
                });
            }),
        ]);

        return {
            success: true,
            data: {
                totalAccounts,
                activeAccounts,
                frozenAccounts,
                suspendedAccounts,
                closedAccounts,
                totalBalance: totalBalance._sum.balance || 0,
                totalLoans: totalLoans._sum.loanAmount || 0,
                avgBalance: avgBalance._avg.balance || 0,
                accountsByType,
            },
        };
    } catch (error) {
        console.error('Error fetching account stats:', error);
        return {
            success: false,
            message: 'Failed to fetch account statistics',
        };
    }
}