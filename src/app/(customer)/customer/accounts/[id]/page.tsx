// app/customer/accounts/[id]/page.tsx - Account Details Page
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import AccountDetails from '../../components/account/AccountDetails';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountPage({ params }: PageProps) {
  const { id } = await params;
  const accountId = parseInt(id);
  
  if (isNaN(accountId)) {
    notFound();
  }
  
  // Check authentication
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'CUSTOMER') {
    redirect('/auth/login');
  }
  
  // Fetch account with all related data
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      customerId: user.userId, // Ensure user owns this account
    },
    include: {
      accountType: true,
      accountStatus: true,
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });
  
  if (!account) {
    notFound();
  }
  
  // Fetch recent transactions for this account
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { accountId: account.id },
        { fromAccountId: account.id },
        { toAccountId: account.id },
      ],
    },
    include: {
      transactionType: true,
      transactionStatus: true,
      fromAccount: {
        select: {
          id: true,
          accountNumber: true,
          customer: {
            select: {
              firstName: true,
              lastName: true,
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
            },
          },
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });
  
  // Fetch account transaction history (balance changes)
  const accountTransactions = await prisma.accountTransaction.findMany({
    where: {
      accountId: account.id,
    },
    include: {
      transaction: {
        include: {
          transactionType: true,
          transactionStatus: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });
  
  // Calculate statistics
  const totalDeposits = await prisma.transaction.aggregate({
    where: {
      accountId: account.id,
      amount: { gt: 0 },
    },
    _sum: { amount: true },
  });
  
  const totalWithdrawals = await prisma.transaction.aggregate({
    where: {
      accountId: account.id,
      amount: { lt: 0 },
    },
    _sum: { amount: true },
  });
  
  // Get monthly transaction count for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const monthlyStats = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "created_at") as month,
      COUNT(*) as transaction_count,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_deposits,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_withdrawals
    FROM transactions
    WHERE account_id = ${account.id}
      AND "created_at" >= ${sixMonthsAgo}
    GROUP BY DATE_TRUNC('month', "created_at")
    ORDER BY month DESC
  `;
  
  return (
    <AccountDetails
      account={account}
      recentTransactions={recentTransactions}
      accountTransactions={accountTransactions}
      statistics={{
        totalTransactions: account._count.transactions,
        totalDeposits: totalDeposits._sum.amount || 0,
        totalWithdrawals: Math.abs(totalWithdrawals._sum.amount || 0),
        monthlyStats: monthlyStats as any[],
      }}
    />
  );
}