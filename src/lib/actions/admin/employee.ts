'use server';

import prisma from '@/lib/prisma';
import PATHS from '@/paths';
import { EmployeeInput, employeeSchema } from '@/validation/admin';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// Get all employees (tellers and managers)
export async function getEmployees(params?: {
    search?: string;
    role?: 'TELLER' | 'MANAGER' | 'ALL';
    status?: 'ACTIVE' | 'BANNED' | 'ALL';
    page?: number;
    pageSize?: number;
  }): Promise<{
    success: boolean;
    message?: string;
    data?: {
      employees: any[];
      pagination: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };
    };
  }> {
    try {
      const {
        search = '',
        role = 'ALL',
        status = 'ALL',
        page = 1,
        pageSize = 5,
      } = params || {};
  
      const skip = (page - 1) * pageSize;
  
      // Build where clause
      const where: any = {
        OR: [
          { role: 'TELLER' },
          { role: 'MANAGER' },
        ],
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
  
      // Filter by role
      if (role !== 'ALL') {
        where.role = role;
      }
  
      // Filter by status
      if (status !== 'ALL') {
        where.status = status;
      }
  
      // Get employees with pagination
      const [employees, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                accounts: true,
                transactions: true,
                approvals: true,
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
          employees,
          pagination: {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    } catch (error) {
      console.error('Error fetching employees:', error);
      return {
        success: false,
        message: 'Failed to fetch employees',
      };
    }
  }

// Get single employee by ID
export async function getEmployeeById(id: number) {
  try {
    const employee = await prisma.user.findUnique({
      where: { id, OR: [{ role: 'TELLER' }, { role: 'MANAGER' }] },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) {
      return {
        success: false,
        message: 'Employee not found',
      };
    }

    return {
      success: true,
      data: { employee },
    };
  } catch (error) {
    console.error('Error fetching employee:', error);
    return {
      success: false,
      message: 'Failed to fetch employee',
    };
  }
}

// Create new employee
export async function createEmployee(data: EmployeeInput) {
  try {
    // Validate input
    const validatedData = employeeSchema.parse(data);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return {
        success: false,
        message: 'Email already exists',
        errors: [{ field: 'email', message: 'Email already exists' }],
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password!, 12);

    // Create employee
    const employee = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath(PATHS.admin.employees);
    return {
      success: true,
      message: 'Employee created successfully',
      data: { employee },
    };
  } catch (error: any) {
    console.error('Error creating employee:', error);
    
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
      message: 'Failed to create employee',
    };
  }
}

// Update employee
export async function updateEmployee(id: number, data: Partial<EmployeeInput>) {
  try {
    // Get existing employee
    const existingEmployee = await prisma.user.findUnique({
      where: { id, OR: [{ role: 'TELLER' }, { role: 'MANAGER' }] },
    });

    if (!existingEmployee) {
      return {
        success: false,
        message: 'Employee not found',
      };
    }

    // Prepare update data
    const updateData: any = { ...data };

    // If password is provided, hash it
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    } else {
      // Remove password from update if not provided
      delete updateData.password;
    }

    // Update employee
    const employee = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    revalidatePath(PATHS.admin.employees);
    return {
      success: true,
      message: 'Employee updated successfully',
      data: { employee },
    };
  } catch (error: any) {
    console.error('Error updating employee:', error);
    
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
      message: 'Failed to update employee',
    };
  }
}

// Delete employee
export async function deleteEmployee(id: number) {
  try {
    // Check if employee exists
    const existingEmployee = await prisma.user.findUnique({
      where: { id, OR: [{ role: 'TELLER' }, { role: 'MANAGER' }] },
    });

    if (!existingEmployee) {
      return {
        success: false,
        message: 'Employee not found',
      };
    }

    // Delete employee
    await prisma.user.delete({
      where: { id },
    });

    revalidatePath(PATHS.admin.employees);
    return {
      success: true,
      message: 'Employee deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting employee:', error);
    return {
      success: false,
      message: 'Failed to delete employee',
    };
  }
}

// Toggle employee status
export async function toggleEmployeeStatus(id: number) {
  try {
    const employee = await prisma.user.findUnique({
      where: { id, OR: [{ role: 'TELLER' }, { role: 'MANAGER' }] },
    });

    if (!employee) {
      return {
        success: false,
        message: 'Employee not found',
      };
    }

    const newStatus = employee.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';

    await prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath(PATHS.admin.employees);
    return {
      success: true,
      message: `Employee ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'} successfully`,
      data: { status: newStatus },
    };
  } catch (error) {
    console.error('Error toggling employee status:', error);
    return {
      success: false,
      message: 'Failed to update employee status',
    };
  }
}