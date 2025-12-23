// app/customer/transactions/[id]/page.tsx - Transaction Details Page
import TransactionDetails from '@/app/(customer)/customer/components/transactions/TransactionDetails';
import { Transaction } from '@/generated/prisma/client';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TransactionPage({ params }: PageProps) {
  const { id } = await params;
  const transactionId = parseInt(id);
  
  if (isNaN(transactionId)) {
    notFound();
  }
  
  // Check authentication
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'CUSTOMER') {
    redirect('/auth/login');
  }
  
  // Fetch transaction with all related data
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      OR: [
        { userId: user.userId }, // User initiated the transaction
        { account: { customerId: user.userId } }, // User owns the account
        { fromAccount: { customerId: user.userId } }, // User owns source account
        { toAccount: { customerId: user.userId } }, // User owns destination account
      ],
    },
    include: {
      transactionType: true,
      transactionStatus: true,
      account: {
        select: {
          id: true,
          accountNumber: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      fromAccount: {
        select: {
          id: true,
          accountNumber: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      toAccount: {
        select: {
          id: true,
          accountNumber: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      accountTransactions: {
        where: {
          OR: [
            { account: { customerId: user.userId } },
            { accountId: transactionId },
          ],
        },
        include: {
          account: {
            select: {
              id: true,
              accountNumber: true,
            },
          },
        },
      },
      approvals: {
        include: {
          status: true,
          approver: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });
  
  if (!transaction) {
    notFound();
  }
  
  // Get related transactions (for transfers)
  let relatedTransactions:Transaction[] = [];
  if (transaction.transactionType.type === 'transfer' && transaction.referenceNumber) {
    // Find related transfer transactions (incoming/outgoing pairs)
    const refPrefix = transaction.referenceNumber.split('-').slice(0, -1).join('-');
    relatedTransactions = await prisma.transaction.findMany({
      where: {
        referenceNumber: {
          startsWith: refPrefix,
        },
        id: {
          not: transaction.id,
        },
      },
      include: {
        transactionType: true,
        transactionStatus: true,
        account: {
          select: {
            accountNumber: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }
  
  return (
    <TransactionDetails
      transaction={transaction}
      relatedTransactions={relatedTransactions}
    />
  );
}