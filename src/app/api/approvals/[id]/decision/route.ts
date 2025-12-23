// app/api/approvals/[id]/decision/route.ts
import { requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types/api';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  {params}: { params: Promise<{ id: string }> }  // ✅ params is a Promise
) {
  try {
    const user = await requireRole(['TELLER', 'MANAGER', 'ADMIN']);
    const {id} = await params
    const approvalId = parseInt(id);
    
    const body = await request.json();
    const { decision, comments } = body;
    
    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { success: false, message: 'Invalid decision. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }
    
    // Get the approval with transaction details
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        transaction: {
          include: {
            fromAccount: true,
            toAccount: true,
            transactionStatus: true
          }
        },
        status: true
      }
    });
    
    if (!approval) {
      return NextResponse.json(
        { success: false, message: 'Approval not found' },
        { status: 404 }
      );
    }
    
    if (approval.status.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: `Approval is already ${approval.status.status}` },
        { status: 400 }
      );
    }
    
    // Check user's role and approval limits
    const userRole = user.role;
    const transactionAmount = Math.abs(approval.transaction.amount);
    
    if (userRole === 'TELLER' && transactionAmount > approval.approverLimit) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Transaction amount exceeds your approval limit of $${approval.approverLimit}` 
        },
        { status: 403 }
      );
    }
    
    // Process the decision
    const result = await prisma.$transaction(async (tx) => {
      const status = await tx.approvalStatus.findUnique({
        where: { status: decision }
      });
      
      const transactionStatus = await tx.transactionStatus.findUnique({
        where: { status: decision === 'approved' ? 'completed' : 'failed' }
      });
      
      if (!status || !transactionStatus) {
        throw new Error('System configuration error');
      }
      
      // Update approval
      const updatedApproval = await tx.approval.update({
        where: { id: approvalId },
        data: {
          statusId: status.id,
          approverId: user.userId,
          comments: comments || `${decision} by ${user.firstName} ${user.lastName}`,
          updatedAt: new Date()
        }
      });
      
      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id: approval.transaction.id },
        data: {
          transactionStatusId: transactionStatus.id
        }
      });
      
      // If rejected, reverse the transaction
      if (decision === 'rejected') {
        // Find the matching incoming transaction
        const referenceBase = approval.transaction.referenceNumber.replace('-OUT', '');
        const incomingTransaction = await tx.transaction.findFirst({
          where: {
            referenceNumber: `${referenceBase}-IN`
          }
        });
        
        if (incomingTransaction) {
          await tx.transaction.update({
            where: { id: incomingTransaction.id },
            data: {
              transactionStatusId: transactionStatus.id
            }
          });
          
          // Reverse the balance changes if they were already made
          // Note: In your current implementation, balances are updated immediately
          // even for pending approvals. You might want to change this.
          await tx.account.update({
            where: { id: approval.transaction.fromAccountId! },
            data: {
              balance: { increment: Math.abs(approval.transaction.amount) }
            }
          });
          
          await tx.account.update({
            where: { id: approval.transaction.toAccountId! },
            data: {
              balance: { decrement: Math.abs(approval.transaction.amount) }
            }
          });
        }
      }
      
      // Create notification for the customer
      await tx.notification.create({
        data: {
          userId: approval.transaction.userId,
          title: `Transfer ${decision}`,
          message: `Your transfer of $${Math.abs(approval.transaction.amount).toFixed(2)} has been ${decision}. ${comments || ''}`,
          type: 'TRANSACTION'
        }
      });
      
      return {
        approval: updatedApproval,
        transaction: updatedTransaction
      };
    });
    
    const response: ApiResponse = {
      success: true,
      message: `Transfer ${decision} successfully`,
      data: result
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Approval decision error:', error);
    
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process decision' },
      { status: 500 }
    );
  }
}