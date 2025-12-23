import { getCurrentUser, requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  Badge,
  Button,
  Card,
  Container,
  Grid,
  GridCol,
  Group,
  ProgressLabel,
  ProgressRoot,
  ProgressSection,
  RingProgress,
  Select,
  SimpleGrid,
  Stack,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  Title
} from '@mantine/core';
import {
  IconCurrencyDollar,
  IconEdit,
  IconEye,
  IconPlus,
  IconReceipt,
  IconUsers,
  IconWallet
} from '@tabler/icons-react';
import { redirect } from 'next/navigation';
import StatsCard from './components/StatsCard';
import SystemHealthItem from './components/SystemHealthItem';
import UserCard from './components/UserCard';

export default async function AdminDashboardPage() {
  // Check if user is admin, redirect if not
  try {
    await requireRole(['ADMIN']);
  } catch {
    redirect('/auth/login');
  }

  // Fetch statistics in parallel
  const [
    totalUsers,
    totalAccounts,
    totalTransactions,
    pendingApprovals,
    systemStats,
    recentTransactions,
    recentUsers,
  ] = await Promise.all([
    // Total users count
    prisma.user.count(),

    // Total accounts count
    prisma.account.count(),

    // Total transactions count
    prisma.transaction.count(),

    // Pending approvals count
    prisma.approval.count({
      where: {
        status: {
          status: 'pending',
        },
      },
    }),


    // System statistics
    getSystemStats(),

    // Recent transactions (last 10)
    prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        transactionType: true,
        transactionStatus: true,
        account: {
          select: {
            accountNumber: true,
          },
        },
      },
    }),

    // Recent users (last 5)
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const user = await getCurrentUser();

  return (
    <Container fluid>
      <Stack gap="lg">
        {/* Welcome header */}
        <Group justify="space-between">
          <div>
            <Title order={1}>Admin Dashboard</Title>
            <Text c="dimmed">
              Welcome back, {user?.firstName} {user?.lastName}
            </Text>
          </div>
          <Group>
            <Badge color="green" size="lg">
              System Status: Operational
            </Badge>
            <Button leftSection={<IconPlus size={16} />} variant="light">
              Quick Action
            </Button>
          </Group>
        </Group>

        {/* Stats Overview Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          <StatsCard
            title="Total Users"
            value={totalUsers}
            icon={IconUsers}
            color="blue"
            description={`${systemStats.activeUsers} active, ${systemStats.newUsersToday} new today`}
            trend={15}
          />

          <StatsCard
            title="Total Accounts"
            value={totalAccounts}
            icon={IconWallet}
            color="green"
            description={`${systemStats.activeAccounts} active, ${systemStats.overdrawnAccounts} overdrawn`}
            trend={8}
          />

          <StatsCard
            title="Total Transactions"
            value={totalTransactions}
            icon={IconReceipt}
            color="orange"
            description={`${systemStats.transactionsToday} today, $${systemStats.totalTransactionValue.toLocaleString()} total value`}
            trend={22}
          />

          <StatsCard
            title="Pending Approvals"
            value={pendingApprovals}
            icon={IconCurrencyDollar}
            color="red"
            description={`${systemStats.highPriorityApprovals} high priority`}
            trend={-5}
          />
        </SimpleGrid>

        {/* Main Content Grid */}
        <Grid>
          {/* Left Column - System Health & Recent Users */}
          <GridCol span={{ base: 12, lg: 4 }}>
            <Stack>
              {/* System Health Card */}
              <Card withBorder shadow="sm" radius="md">
                <Title order={3} mb="md">System Health</Title>
                <Group justify="center" mb="md">
                  <RingProgress
                    size={180}
                    thickness={16}
                    roundCaps
                    label={
                      <Text size="xl" fw={700} ta="center">
                        {systemStats.uptime}%
                      </Text>
                    }
                    sections={[
                      { value: systemStats.uptime, color: 'green', tooltip: 'Uptime' },
                      { value: 100 - systemStats.uptime, color: 'yellow', tooltip: 'Downtime' },
                    ]}
                  />
                </Group>
                <Stack gap="xs">
                  <SystemHealthItem label="Database" status="healthy" />
                  <SystemHealthItem label="API Services" status="healthy" />
                  <SystemHealthItem label="Authentication" status="healthy" />
                  <SystemHealthItem label="Email Service" status="warning" />
                  <SystemHealthItem label="File Storage" status="healthy" />
                </Stack>
              </Card>

              {/* Recent Users Card */}
              <Card withBorder shadow="sm" radius="md">
                <Group justify="space-between" mb="md">
                  <Title order={3}>Recent Users</Title>
                  <Button variant="subtle" size="xs">
                    View All
                  </Button>
                </Group>
                <Stack gap="xs">
                  {recentUsers.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </Stack>
              </Card>
            </Stack>
          </GridCol>

          {/* Right Column - Transactions & Analytics */}
          <GridCol span={{ base: 12, lg: 8 }}>
            <Stack>
              {/* Recent Transactions Card */}
              <Card withBorder shadow="sm" radius="md">
                <Group justify="space-between" mb="md">
                  <Title order={3}>Recent Transactions</Title>
                  <Group>
                    <Select
                      placeholder="Filter by type"
                      data={[
                        { value: 'all', label: 'All Types' },
                        { value: 'deposit', label: 'Deposits' },
                        { value: 'withdrawal', label: 'Withdrawals' },
                        { value: 'transfer', label: 'Transfers' },
                      ]}
                      size="xs"
                    />
                    <Button variant="subtle" size="xs">
                      View All
                    </Button>
                  </Group>
                </Group>

                <TableScrollContainer minWidth={600}>
                  <Table verticalSpacing="sm">
                    <TableThead>
                      <TableTr>
                        <TableTh>Date</TableTh>
                        <TableTh>User</TableTh>
                        <TableTh>Account</TableTh>
                        <TableTh>Type</TableTh>
                        <TableTh>Amount</TableTh>
                        <TableTh>Status</TableTh>
                        <TableTh>Actions</TableTh>
                      </TableTr>
                    </TableThead>
                    <TableTbody>
                      {recentTransactions.map((transaction) => (
                        <TableTr key={transaction.id}>
                          <TableTd>
                            <Text size="sm">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {new Date(transaction.createdAt).toLocaleTimeString()}
                            </Text>
                          </TableTd>
                          <TableTd>
                            <Text size="sm">
                              {transaction.user.firstName} {transaction.user.lastName}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {transaction.user.email}
                            </Text>
                          </TableTd>
                          <TableTd>
                            <Text size="sm">
                              {transaction.account.accountNumber}
                            </Text>
                          </TableTd>
                          <TableTd>
                            <Badge
                              color={
                                transaction.transactionType.type === 'deposit' ? 'green' :
                                  transaction.transactionType.type === 'withdrawal' ? 'red' :
                                    transaction.transactionType.type === 'transfer' ? 'blue' : 'gray'
                              }
                              variant="light"
                            >
                              {transaction.transactionType.type}
                            </Badge>
                          </TableTd>
                          <TableTd>
                            <Text
                              size="sm"
                              fw={600}
                              c={transaction.transactionType.type === 'deposit' ? 'green' : 'red'}
                            >
                              ${transaction.amount.toFixed(2)}
                            </Text>
                          </TableTd>
                          <TableTd>
                            <Badge
                              color={
                                transaction.transactionStatus.status === 'completed' ? 'green' :
                                  transaction.transactionStatus.status === 'pending' ? 'yellow' : 'red'
                              }
                            >
                              {transaction.transactionStatus.status}
                            </Badge>
                          </TableTd>
                          <TableTd>
                            <Group gap="xs">
                              <Button size="xs" variant="subtle">
                                <IconEye size={14} />
                              </Button>
                              <Button size="xs" variant="subtle">
                                <IconEdit size={14} />
                              </Button>
                            </Group>
                          </TableTd>
                        </TableTr>
                      ))}
                    </TableTbody>
                  </Table>
                </TableScrollContainer>
              </Card>

              {/* Financial Overview Card */}
              <Card withBorder shadow="sm" radius="md">
                <Title order={3} mb="md">Financial Overview</Title>
                <Grid>
                  <GridCol span={{ base: 12, md: 6 }}>
                    <Stack gap="md">
                      <div>
                        <Text size="sm" c="dimmed">Total Assets</Text>
                        <Title order={2}>${systemStats.totalAssets.toLocaleString()}</Title>
                      </div>
                      <div>
                        <Text size="sm" c="dimmed">Active Loans</Text>
                        <Title order={2}>${systemStats.totalLoans.toLocaleString()}</Title>
                      </div>
                      <div>
                        <Text size="sm" c="dimmed">Daily Volume</Text>
                        <Title order={2}>${systemStats.dailyVolume.toLocaleString()}</Title>
                      </div>
                    </Stack>
                  </GridCol>
                  <GridCol span={{ base: 12, md: 6 }}>
                    <Stack gap="md">
                      <div>
                        <Text size="sm" c="dimmed" mb={4}>Account Types Distribution</Text>
                        <ProgressRoot size={24}>
                          <ProgressSection value={40} color="blue">
                            <ProgressLabel>Savings</ProgressLabel>
                          </ProgressSection>
                          <ProgressSection value={30} color="green">
                            <ProgressLabel>Checking</ProgressLabel>
                          </ProgressSection>
                          <ProgressSection value={20} color="orange">
                            <ProgressLabel>Credit</ProgressLabel>
                          </ProgressSection>
                          <ProgressSection value={10} color="red">
                            <ProgressLabel>Loan</ProgressLabel>
                          </ProgressSection>
                        </ProgressRoot>
                      </div>
                      <div>
                        <Text size="sm" c="dimmed" mb={4}>Transaction Status</Text>
                        <ProgressRoot size={16}>
                          <ProgressSection value={85} color="green">
                            <ProgressLabel>Completed</ProgressLabel>
                          </ProgressSection>
                          <ProgressSection value={10} color="yellow">
                            <ProgressLabel>Pending</ProgressLabel>
                          </ProgressSection>
                          <ProgressSection value={5} color="red">
                            <ProgressLabel>Failed</ProgressLabel>
                          </ProgressSection>
                        </ProgressRoot>
                      </div>
                    </Stack>
                  </GridCol>
                </Grid>
              </Card>
            </Stack>
          </GridCol>
        </Grid>
      </Stack>
    </Container>
  );
}

// Helper component for stats cards


// Helper component for system health items


// Helper component for user cards


// Helper function to get system statistics
async function getSystemStats() {
  const [
    activeUsers,
    newUsersToday,
    activeAccounts,
    overdrawnAccounts,
    transactionsToday,
    totalTransactionValue,
    totalAssets,
    totalLoans,
    dailyVolume,
  ] = await Promise.all([
    // Active users (not banned)
    prisma.user.count({
      where: { status: 'ACTIVE' },
    }),

    // Users created today
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),

    // Active accounts
    prisma.account.count({
      where: {
        accountStatus: {
          status: 'active',
        },
      },
    }),

    // Overdrawn accounts
    prisma.account.count({
      where: {
        balance: {
          lt: 0,
        },
      },
    }),

    // Transactions today
    prisma.transaction.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),

    // Total transaction value
    prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
    }),

    // Total assets (sum of all positive balances)
    prisma.account.aggregate({
      _sum: {
        balance: true,
      },
      where: {
        balance: {
          gt: 0,
        },
      },
    }),

    // Total loans
    prisma.account.aggregate({
      _sum: {
        loanAmount: true,
      },
      where: {
        accountType: {
          type: 'loan',
        },
      },
    }),

    // Daily volume (sum of today's transactions)
    prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  return {
    activeUsers,
    newUsersToday,
    activeAccounts,
    overdrawnAccounts,
    transactionsToday,
    totalTransactionValue: totalTransactionValue._sum.amount || 0,
    totalAssets: Math.abs(totalAssets._sum.balance || 0),
    totalLoans: totalLoans._sum.loanAmount || 0,
    dailyVolume: dailyVolume._sum.amount || 0,
    uptime: 98.5, // Mock uptime percentage
    highPriorityApprovals: 3, // Mock high priority approvals
  };
}