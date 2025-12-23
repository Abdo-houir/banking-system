// app/customer/accounts/[id]/transactions/page.tsx - Account Transactions Page
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import AccountTransactions from '../../../components/account/AccountTransactions';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function AccountTransactionsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const accountId = parseInt(id);
  const queryParams = await searchParams;
  
  if (isNaN(accountId)) {
    notFound();
  }
  
  // Check authentication
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'CUSTOMER') {
    redirect('/auth/login');
  }
  
  // Fetch account to verify ownership
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      customerId: user.userId,
    },
    include: {
      accountType: true,
      accountStatus: true,
    },
  });
  
  if (!account) {
    notFound();
  }
  
  // Parse query parameters
  const page = parseInt(queryParams.page || '1');
  const limit = parseInt(queryParams.limit || '20');
  const skip = (page - 1) * limit;
  
  // Build filter conditions
  const where: any = {
    OR: [
      { accountId: account.id },
      { fromAccountId: account.id },
      { toAccountId: account.id },
    ],
  };
  
//   // Filter by transaction type
//   if (queryParams.type) {
//     const transactionType = await prisma.transactionType.findUnique({
//       where: { type: queryParams.type },
//     });
//     if (transactionType) {
//       where.transactionTypeId = transactionType.id;
//     }
//   }
  
//   // Filter by status
//   if (queryParams.status) {
//     const transactionStatus = await prisma.transactionStatus.findUnique({
//       where: { status: queryParams.status },
//     });
//     if (transactionStatus) {
//       where.transactionStatusId = transactionStatus.id;
//     }
//   }
  
//   // Filter by date range
//   if (queryParams.startDate || queryParams.endDate) {
//     where.createdAt = {};
//     if (queryParams.startDate) {
//       where.createdAt.gte = new Date(queryParams.startDate);
//     }
//     if (queryParams.endDate) {
//       const endDate = new Date(queryParams.endDate);
//       endDate.setHours(23, 59, 59, 999);
//       where.createdAt.lte = endDate;
//     }
//   }
  
//   // Search by description or reference number
//   if (queryParams.search) {
//     where.OR = [
//       ...where.OR,
//       { description: { contains: queryParams.search, mode: 'insensitive' } },
//       { referenceNumber: { contains: queryParams.search, mode: 'insensitive' } },
//     ];
//   }
  
  // Determine sort order
  const orderBy: any = {};
  if (queryParams.sort) {
    const [field, order] = queryParams.sort.split(':');
    orderBy[field] = order || 'desc';
  } else {
    orderBy.createdAt = 'desc';
  }
  
  // Fetch transactions with pagination
  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
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
        accountTransactions: {
          where: { accountId: account.id },
          take: 1,
          orderBy: { id: 'desc' },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);
  
  // Get transaction summary statistics
  const summary = await prisma.transaction.aggregate({
    where: {
      OR: [
        { accountId: account.id },
        { fromAccountId: account.id },
        { toAccountId: account.id },
      ],
    },
    _count: true,
    _sum: { amount: true },
    _avg: { amount: true },
    _min: { amount: true },
    _max: { amount: true },
  });
  
  // Get transaction types for filter dropdown
  const transactionTypes = await prisma.transactionType.findMany({
    orderBy: { type: 'asc' },
  });
  
  // Get transaction statuses for filter dropdown
  const transactionStatuses = await prisma.transactionStatus.findMany({
    orderBy: { status: 'asc' },
  });
  
  // Get monthly summary for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const monthlySummary = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "created_at") as month,
      COUNT(*) as count,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_incoming,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_outgoing
    FROM transactions
    WHERE (
      account_id = ${account.id} 
      OR from_account_id = ${account.id} 
      OR to_account_id = ${account.id}
    )
      AND "created_at" >= ${sixMonthsAgo}
    GROUP BY DATE_TRUNC('month', "created_at")
    ORDER BY month DESC
  `;
  
  return (
    <AccountTransactions
      account={account}
      transactions={transactions}
      pagination={{
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }}
      filters={{
        type: queryParams.type,
        status: queryParams.status,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
        search: queryParams.search,
        sort: queryParams.sort,
      }}
      summary={{
        count: summary._count,
        totalAmount: summary._sum.amount || 0,
        averageAmount: summary._avg.amount || 0,
        minAmount: summary._min.amount || 0,
        maxAmount: summary._max.amount || 0,
        monthlySummary: monthlySummary as any[],
      }}
      transactionTypes={transactionTypes}
      transactionStatuses={transactionStatuses}
    />
  );
}