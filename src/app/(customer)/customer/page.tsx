// app/customer/dashboard/page.tsx - Customer Home Page
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import CustomerDashboard from './components/CustomerDashboard';

export default async function CustomerDashboardPage() {
  // Check authentication
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'CUSTOMER') {
    redirect('/auth/login');
  }
  
  // Fetch customer's accounts with related data
  const accounts = await prisma.account.findMany({
    where: {
      customerId: user.userId,
    },
    include: {
      accountType: true,
      accountStatus: true,
      _count: {
        select: {
          transactions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  // Get recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      accountId: {
        in: accounts.map(acc => acc.id),
      },
    },
    include: {
      transactionType: true,
      transactionStatus: true,
      fromAccount: {
        select: {
          accountNumber: true,
        },
      },
      toAccount: {
        select: {
          accountNumber: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });
  
  // Get notifications
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.userId,
      isRead: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });
  
  return (
    <CustomerDashboard
      user={user}
      accounts={accounts}
      totalBalance={totalBalance}
      recentTransactions={recentTransactions}
      notifications={notifications}
    />
  );
}