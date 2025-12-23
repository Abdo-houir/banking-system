// app/api/approvals/pending/route.ts
import { requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await requireRole(['TELLER', 'MANAGER', 'ADMIN']);
    
    // Get user's role to determine approval limits
    const userRole = user.role;
    
    // Get pending approvals based on user role
    const pendingApprovals = await prisma.approval.findMany({
      where: {
        status: {
          status: 'pending'
        },
        // Filter by approver role - managers can see all, tellers see only teller-role approvals
        approverRole: userRole === 'MANAGER' || userRole === 'ADMIN' 
          ? undefined 
          : { role: 'teller' }
      },
      include: {
        transaction: {
          include: {
            account: {
              include: {
                customer: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                },
                accountType: true
              }
            },
            fromAccount: {
              include: {
                customer: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            toAccount: {
              include: {
                customer: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            transactionType: true,
            transactionStatus: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        status: true,
        approverRole: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Filter transactions where amount is within user's approval limit
    const filteredApprovals = pendingApprovals.filter(approval => {
      if (userRole === 'MANAGER' || userRole === 'ADMIN') {
        return true; // Managers and admins can approve any amount
      }
      if (userRole === 'TELLER') {
        // Tellers can only approve up to their limit (e.g., 5000)
        const amount = Math.abs(approval.transaction.amount);
        return amount <= approval.approverLimit;
      }
      return false;
    });
    
    const response: ApiResponse = {
      success: true,
      message: 'Pending approvals retrieved successfully',
      data: filteredApprovals
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Get pending approvals error:', error);
    
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch pending approvals' },
      { status: 500 }
    );
  }
}