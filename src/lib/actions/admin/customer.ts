'use server';

import prisma from '@/lib/prisma';
import { AdminCustomerUpdateInput, AdminCustomerUpdateSchema } from '@/validation/admin';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// Get all customers
export async function getCustomers(params?: {
  search?: string;
  status?: 'ACTIVE' | 'BANNED' | 'ALL';
  page?: number;
  pageSize?: number;
}) {
  try {
    const {
      search = '',
      status = 'ALL',
      page = 1,
      pageSize = 5,
    } = params || {};

    const skip = (page - 1) * pageSize;

    // Build where clause - only customers
    const where: any = {
      role: 'CUSTOMER',
    };

    // Add search filters
    if (search) {
      where.AND = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Filter by status
    if (status !== 'ALL') {
      where.status = status;
    }

    // Get customers with pagination
    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              accounts: true,
              transactions: true,
              notifications: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: {
        customers,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  } catch (error) {
    console.error('Error fetching customers:', error);
    return {
      success: false,
      message: 'Failed to fetch customers',
    };
  }
}

// Get single customer by ID with full details
export async function getCustomerById(id: number) {
  try {
    const customer = await prisma.user.findUnique({
      where: { id, role: 'CUSTOMER' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            balance: true,
            createdAt: true,
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
            _count: {
              select: {
                transactions: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        transactions: {
          take: 10,
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
        notifications: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
            isRead: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
      };
    }

    return {
      success: true,
      data: { customer },
    };
  } catch (error) {
    console.error('Error fetching customer:', error);
    return {
      success: false,
      message: 'Failed to fetch customer',
    };
  }
}

// Update customer
export async function updateCustomer(id: number, data: AdminCustomerUpdateInput) {
  try {
    // Validate input
    const validatedData = AdminCustomerUpdateSchema.parse(data);

    // Check if customer exists
    const existingCustomer = await prisma.user.findUnique({
      where: { id, role: 'CUSTOMER' },
    });

    if (!existingCustomer) {
      return {
        success: false,
        message: 'Customer not found',
      };
    }

    // Update customer
    const customer = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Revalidate paths
    revalidatePath('/admin/customers');
    revalidatePath('/admin/customers', 'page');
    revalidatePath(`/admin/customers/${id}`);

    return {
      success: true,
      message: 'Customer updated successfully',
      data: { customer },
    };
  } catch (error: any) {
    console.error('Error updating customer:', error);
    
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
      message: 'Failed to update customer',
    };
  }
}

// Toggle customer status
export async function toggleCustomerStatus(id: number) {
  try {
    const customer = await prisma.user.findUnique({
      where: { id, role: 'CUSTOMER' },
    });

    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
      };
    }

    const newStatus = customer.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';

    await prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });

    // Revalidate paths
    revalidatePath('/admin/customers');
    revalidatePath('/admin/customers', 'page');
    revalidatePath(`/admin/customers/${id}`);

    return {
      success: true,
      message: `Customer ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'} successfully`,
      data: { status: newStatus },
    };
  } catch (error) {
    console.error('Error toggling customer status:', error);
    return {
      success: false,
      message: 'Failed to update customer status',
    };
  }
}

// Reset customer password
export async function resetCustomerPassword(id: number) {
  try {
    const customer = await prisma.user.findUnique({
      where: { id, role: 'CUSTOMER' },
    });

    if (!customer) {
      return {
        success: false,
        message: 'Customer not found',
      };
    }

    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      message: 'Password reset successfully',
      data: { tempPassword }, // In production, send via email, don't return
    };
  } catch (error) {
    console.error('Error resetting customer password:', error);
    return {
      success: false,
      message: 'Failed to reset password',
    };
  }
}

// Get customer statistics
export async function getCustomerStats() {
  try {
    const [
      totalCustomers,
      activeCustomers,
      bannedCustomers,
      totalAccounts,
      totalBalance,
      newCustomersToday,
      avgAccountsPerCustomer,
    ] = await Promise.all([
      // Total customers
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      
      // Active customers
      prisma.user.count({ where: { role: 'CUSTOMER', status: 'ACTIVE' } }),
      
      // Banned customers
      prisma.user.count({ where: { role: 'CUSTOMER', status: 'BANNED' } }),
      
      // Total accounts
      prisma.account.count({ where: { customer: { role: 'CUSTOMER' } } }),
      
      // Total balance
      prisma.account.aggregate({
        where: { customer: { role: 'CUSTOMER' } },
        _sum: { balance: true },
      }),
      
      // New customers today
      prisma.user.count({
        where: {
          role: 'CUSTOMER',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      
      // Average accounts per customer
      prisma.account.groupBy({
        by: ['customerId'],
        _count: true,
        where: { customer: { role: 'CUSTOMER' } },
      }).then(results => {
        if (results.length === 0) return 0;
        const totalAccounts = results.reduce((sum, item) => sum + item._count, 0);
        return totalAccounts / results.length;
      }),
    ]);

    return {
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        bannedCustomers,
        totalAccounts,
        totalBalance: totalBalance._sum.balance || 0,
        newCustomersToday,
        avgAccountsPerCustomer,
      },
    };
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return {
      success: false,
      message: 'Failed to fetch customer statistics',
    };
  }
}