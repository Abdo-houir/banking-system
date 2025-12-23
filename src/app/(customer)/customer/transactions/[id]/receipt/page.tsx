// app/customer/transactions/[id]/receipt/page.tsx - Transaction Receipt Page
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import TransactionReceipt from '../../../components/transactions/TransactionReceipt';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TransactionReceiptPage({ params }: PageProps) {
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
  
  // Fetch transaction with all related data for receipt
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      OR: [
        { userId: user.userId },
        { account: { customerId: user.userId } },
        { fromAccount: { customerId: user.userId } },
        { toAccount: { customerId: user.userId } },
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
              phone: true,
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
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      accountTransactions: {
        where: {
          account: {
            customerId: user.userId,
          },
        },
        include: {
          account: {
            select: {
              accountNumber: true,
            },
          },
        },
      },
    },
  });
  
  if (!transaction) {
    notFound();
  }
  
  // Bank information (mock data - in real app, this would come from config)
  const bankInfo = {
    name: 'SecureBank',
    address: '123 Financial District, New York, NY 10001',
    phone: '+1 (555) 123-4567',
    email: 'support@securebank.com',
    website: 'www.securebank.com',
    routingNumber: '021000021',
    swiftCode: 'SBUSUS33',
  };
  
  return (
    <TransactionReceipt
      transaction={transaction}
      bankInfo={bankInfo}
      user={user}
    />
  );
}