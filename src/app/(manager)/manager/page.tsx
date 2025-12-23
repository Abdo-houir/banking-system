// app/dashboard/manager/page.tsx
import { getCurrentUser, requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  ActionIcon,
  Badge,
  Card,
  Center,
  Container,
  Grid,
  GridCol,
  Group,
  ProgressLabel,
  ProgressRoot,
  ProgressSection,
  RingProgress,
  Stack,
  Table,
  TableScrollContainer,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Tabs,
  TabsList,
  TabsTab,
  Text,
  Title,
  Tooltip
} from '@mantine/core';
import {
  IconAlertCircle,
  IconBuildingBank,
  IconCheck,
  IconCurrencyDollar,
  IconEye,
  IconTrendingUp
} from '@tabler/icons-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ManagerStatsCard from './components/ManagerStatsCard';
import ApprovalDecisionForm from './components/approve/ApprovalDecisionForm';

// Pagination constants
const ITEMS_PER_PAGE = 10;

interface ManagerDashboardPageProps {
  searchParams?: {
    page?: string;
    tab?: string;
    filter?: string;
  };
}

export default async function ManagerDashboardPage({ 
  searchParams 
}: ManagerDashboardPageProps = {}) {
  // Check if user is manager or admin
  try {
    await requireRole(['MANAGER', 'ADMIN']);
  } catch {
    redirect('/auth/login');
  }

  // Get current page from search params
  const currentPage = Number(searchParams?.page) || 1;
  const currentTab = searchParams?.tab || 'all';

  // Calculate skip for pagination
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Build where clause for approvals
  const approvalWhereClause: any = {
    status: {
      status: 'pending',
    },
  };

  // Apply tab filters
  if (currentTab === 'teller') {
    approvalWhereClause.approverRole = { role: 'teller' };
  } else if (currentTab === 'manager') {
    approvalWhereClause.approverRole = { role: 'manager' };
  } else if (currentTab === 'urgent') {
    // Urgent: pending for more than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    approvalWhereClause.createdAt = { lt: twentyFourHoursAgo };
  }

  // Fetch ALL pending approvals for stats (not limited)
  const [
    allPendingApprovalsForStats,
    paginatedApprovals,
    totalPendingCount,
    largeTransfers,
    recentTransactions,
    accountStats,
    loanStats,
    user,
    highValueTransactions,
    staffActivity,
    // Total counts for each category
    allPendingCount,
    tellerPendingCount,
    managerPendingCount,
    urgentPendingCount
  ] = await Promise.all([
    // All pending approvals for stats calculation
    prisma.approval.findMany({
      where: {
        status: {
          status: 'pending',
        },
      },
      include: {
        transaction: true,
      },
    }),

    // Paginated pending approvals for display
    prisma.approval.findMany({
      where: approvalWhereClause,
      skip,
      take: ITEMS_PER_PAGE,
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
                }
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
                email: true,
                role: true
              }
            }
          }
        },
        status: true,
        approverRole: true,
        approver: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Total count for current filters
    prisma.approval.count({
      where: approvalWhereClause,
    }),

    // Large transfers (over $10,000)
    prisma.transaction.findMany({
      where: {
        transactionType: {
          type: 'transfer'
        },
        amount: {
          lt: -10000 // Negative for outgoing transfers
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        account: {
          select: {
            accountNumber: true,
          }
        },
        transactionStatus: true
      },
      orderBy: { amount: 'asc' },
      take: 10
    }),

    // Recent high-value transactions
    prisma.transaction.findMany({
      where: {
        OR: [
          { amount: { lt: -5000 } }, // Large outgoing
          { amount: { gt: 5000 } }   // Large incoming
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        transactionType: true,
        transactionStatus: true,
        account: {
          select: {
            accountNumber: true,
          }
        }
      }
    }),

    // Account statistics
    prisma.account.aggregate({
      _count: {
        _all: true
      },
      _sum: {
        balance: true
      },
      where: {
        accountStatus: {
          status: 'active'
        }
      }
    }),

    // Loan statistics
    prisma.account.aggregate({
      _count: {
        _all: true
      },
      _sum: {
        loanAmount: true
      },
      where: {
        accountType: {
          type: 'loan'
        },
        accountStatus: {
          status: 'active'
        }
      }
    }),

    // Current user
    getCurrentUser(),

    // High-value transactions for the chart
    prisma.transaction.aggregate({
      _sum: {
        amount: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    }),

    // Staff activity (tellers and managers)
    prisma.user.findMany({
      where: {
        role: {
          in: ['TELLER', 'MANAGER']
        }
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true
      }
    }),

    // Total count for all pending
    prisma.approval.count({
      where: {
        status: {
          status: 'pending',
        },
      },
    }),

    // Total count for teller pending
    prisma.approval.count({
      where: {
        status: {
          status: 'pending',
        },
        approverRole: {
          role: 'teller'
        }
      },
    }),

    // Total count for manager pending
    prisma.approval.count({
      where: {
        status: {
          status: 'pending',
        },
        approverRole: {
          role: 'manager'
        }
      },
    }),

    // Total count for urgent pending (24+ hours)
    prisma.approval.count({
      where: {
        status: {
          status: 'pending',
        },
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
    }),
  ]);

  // Calculate statistics using ALL data, not just current page
  const totalActiveAccounts = accountStats._count._all;
  const totalAssets = accountStats._sum.balance || 0;
  const totalActiveLoans = loanStats._count._all;
  const totalLoanValue = loanStats._sum.loanAmount || 0;
  const totalHighValueTransactions = highValueTransactions._sum.amount || 0;

  // Calculate pending amounts by role from total counts
  const tellerPending = tellerPendingCount;
  const managerPending = managerPendingCount;

  // Calculate total pending value from ALL data, not just current page
  const totalPendingValue = allPendingApprovalsForStats.reduce((sum, approval) => {
    return sum + Math.abs(approval.transaction.amount);
  }, 0);

  // Calculate average approval time (mock data for now)
  const averageApprovalTime = "2.5 hours";


  // Helper function to build URL with params
  const buildUrl = (params: Record<string, string>) => {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) urlParams.set(key, value);
    });
    return `?${urlParams.toString()}`;
  };

  // Helper component for tab links
  const TabLink = ({ 
    value, 
    children,
    activeTab 
  }: { 
    value: string; 
    children: React.ReactNode;
    activeTab: string;
  }) => {
    const isActive = activeTab === value;
    return (
      <Link href={buildUrl({ tab: value, page: '1' })} style={{ textDecoration: 'none' }}>
        <TabsTab
          value={value}
          style={{
            borderBottom: isActive ? '2px solid var(--mantine-color-blue-6)' : 'none',
            color: isActive ? 'var(--mantine-color-blue-6)' : 'inherit',
            fontWeight: isActive ? 600 : 400,
          }}
        >
          {children}
        </TabsTab>
      </Link>
    );
  };

  return (
    <Container fluid>
      <Stack gap="lg">
        {/* Welcome header */}
        <Group justify="space-between">
          <div>
            <Title order={1}>Manager Dashboard</Title>
            <Text c="dimmed">
              Welcome, {user?.firstName} {user?.lastName}
            </Text>
          </div>
          <Group>
            <Badge color="indigo" size="lg" variant="light">
              Manager: {user?.email}
            </Badge>
            <Badge color="green" size="lg">
              {user?.role === 'ADMIN' ? 'Administrator' : 'Manager'}
            </Badge>
          </Group>
        </Group>

        {/* Stats Overview Cards */}
        <Grid>
          <GridCol span={{ base: 12, sm: 6 }}>
            <ManagerStatsCard
              title="Pending Approvals"
              value={allPendingCount}
              icon={IconAlertCircle}
              color="orange"
              description={`$${totalPendingValue.toLocaleString()} total value`}
              trend={managerPending > 0 ? 'high' : 'low'}
            />
          </GridCol>
          <GridCol span={{ base: 12, sm: 6 }}>
            <ManagerStatsCard
              title="Total Assets"
              value={totalAssets}
              icon={IconCurrencyDollar}
              color="green"
              description={`${totalActiveAccounts} active accounts`}
              isCurrency
            />
          </GridCol>
          <GridCol span={{ base: 12, sm: 6 }}>
            <ManagerStatsCard
              title="Active Loans"
              value={totalActiveLoans}
              icon={IconBuildingBank}
              color="blue"
              description={`$${totalLoanValue.toLocaleString()} total`}
            />
          </GridCol>
          <GridCol span={{ base: 12, sm: 6 }}>
            <ManagerStatsCard
              title="High-Value Tx"
              value={Math.abs(totalHighValueTransactions)}
              icon={IconTrendingUp}
              color="red"
              description="Last 30 days"
              isCurrency
            />
          </GridCol>
        </Grid>
        
        {/* Analytics Card */}
        <Card withBorder shadow="sm" radius="md">
          <Title order={3} mb="md">Financial Analytics</Title>
          <Grid>
            <GridCol span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Approval Distribution</Text>
                  <Group gap="md">
                    <RingProgress
                      size={120}
                      thickness={12}
                      roundCaps
                      label={
                        <Text size="xs" fw={700} ta="center">
                          {allPendingCount > 0 ? Math.round((managerPending / allPendingCount) * 100) : 0}%
                        </Text>
                      }
                      sections={[
                        {
                          value: allPendingCount > 0 ? (managerPending / allPendingCount) * 100 : 0,
                          color: 'red',
                          tooltip: 'Manager Level'
                        },
                        {
                          value: allPendingCount > 0 ? (tellerPending / allPendingCount) * 100 : 0,
                          color: 'orange',
                          tooltip: 'Teller Level'
                        }
                      ]}
                    />
                    <div>
                      <Text size="sm" fw={500}>Approval Stats</Text>
                      <Text size="sm" c="dimmed">Average: {averageApprovalTime}</Text>
                      <Text size="sm" c="dimmed">Urgent (24h+): {urgentPendingCount}</Text>
                    </div>
                  </Group>
                </div>
              </Stack>
            </GridCol>
            <GridCol span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Large Transactions (7 Days)</Text>
                  <ProgressRoot size={20} radius="md">
                    <ProgressSection value={60} color="blue">
                      <ProgressLabel>Transfers</ProgressLabel>
                    </ProgressSection>
                    <ProgressSection value={25} color="red">
                      <ProgressLabel>Withdrawals</ProgressLabel>
                    </ProgressSection>
                    <ProgressSection value={15} color="green">
                      <ProgressLabel>Deposits</ProgressLabel>
                    </ProgressSection>
                  </ProgressRoot>
                </div>
                <div>
                  <Text size="sm" c="dimmed" mb="xs">Staff Activity</Text>
                  <Text size="sm">Active Staff: {staffActivity.length}</Text>
                  <Text size="sm" c="dimmed">
                    Tellers: {staffActivity.filter(s => s.role === 'TELLER').length} |
                    Managers: {staffActivity.filter(s => s.role === 'MANAGER').length}
                  </Text>
                </div>
              </Stack>
            </GridCol>
          </Grid>
        </Card>
        
        {/* Main Content Grid */}
        <Grid>
          {/* Left Column - Approvals & Analytics */}
          <GridCol span={{ base: 12, lg: 7 }}>
            <Stack gap="md">
              {/* Pending Approvals Card */}
              <Card withBorder shadow="sm" radius="md">
                <Group justify="space-between" mb="md">
                  <Title order={3}>Pending Approvals</Title>
                  <Group>
                    <Badge color="orange" variant="light">
                      {tellerPending} teller approvals
                    </Badge>
                    <Badge color="red" variant="light">
                      {managerPending} manager approvals
                    </Badge>
                  </Group>
                </Group>

                <Tabs value={currentTab}>
                  <TabsList mb="md">
                    <TabLink value="all" activeTab={currentTab}>
                      All Pending ({allPendingCount})
                    </TabLink>
                    <TabLink value="teller" activeTab={currentTab}>
                      Teller Level ({tellerPendingCount})
                    </TabLink>
                    <TabLink value="manager" activeTab={currentTab}>
                      Manager Level ({managerPendingCount})
                    </TabLink>
                    <TabLink value="urgent" activeTab={currentTab}>
                      Urgent ({urgentPendingCount})
                    </TabLink>
                  </TabsList>

                  {/* Stats row */}
                  <Group justify="space-between" mb="md">
                    <Text size="sm" c="dimmed">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
                      {Math.min(currentPage * ITEMS_PER_PAGE, totalPendingCount)} of {totalPendingCount}
                    </Text>
                  </Group>

                  <TableScrollContainer minWidth={600}>
                    <Table verticalSpacing="sm">
                      <TableThead>
                        <TableTr>
                          <TableTh>Transaction</TableTh>
                          <TableTh>Amount</TableTh>
                          <TableTh>Initiated By</TableTh>
                          <TableTh>Approver Role</TableTh>
                          <TableTh>Time Pending</TableTh>
                          <TableTh>Actions</TableTh>
                        </TableTr>
                      </TableThead>
                      <TableTbody>
                        {paginatedApprovals.length === 0 ? (
                          <TableTr>
                            <TableTd colSpan={6}>
                              <Center py="xl">
                                <Stack align="center" gap="sm">
                                  <IconCheck size={48} color="var(--mantine-color-green-6)" />
                                  <Text c="dimmed">No pending approvals</Text>
                                  <Text size="sm" c="dimmed">
                                    {currentTab !== 'all' 
                                      ? 'No approvals match your filters' 
                                      : 'All approvals have been processed'}
                                  </Text>
                                </Stack>
                              </Center>
                            </TableTd>
                          </TableTr>
                        ) : (
                          paginatedApprovals.map((approval) => {
                            const hoursPending = Math.floor(
                              (Date.now() - new Date(approval.createdAt).getTime()) / (1000 * 60 * 60)
                            );

                            return (
                              <TableTr key={approval.id}>
                                <TableTd>
                                  <Text size="sm" fw={500}>
                                    {approval.transaction.transactionType.type.toUpperCase()}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    Ref: {approval.transaction.referenceNumber}
                                  </Text>
                                </TableTd>
                                <TableTd>
                                  <Text fw={600} c="blue">
                                    ${Math.abs(approval.transaction.amount).toFixed(2)}
                                  </Text>
                                </TableTd>
                                <TableTd>
                                  <Text size="sm">
                                    {approval.transaction.user.firstName}{' '}
                                    {approval.transaction.user.lastName}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {approval.transaction.user.role}
                                  </Text>
                                </TableTd>
                                <TableTd>
                                  <Badge
                                    color={approval.approverRole.role === 'manager' ? 'red' : 'orange'}
                                    variant="light"
                                  >
                                    {approval.approverRole.role.toUpperCase()}
                                  </Badge>
                                </TableTd>
                                <TableTd>
                                  <Text size="sm">
                                    {hoursPending > 24 ? `${Math.floor(hoursPending / 24)}d` : `${hoursPending}h`}
                                  </Text>
                                  {hoursPending > 24 && (
                                    <Badge color="red" size="xs" variant="dot">
                                      Urgent
                                    </Badge>
                                  )}
                                </TableTd>
                                <TableTd>
                                  <Group gap="xs">
                                    <ApprovalDecisionForm
                                      approval={approval}
                                      type="approved"
                                    />
                                    <ApprovalDecisionForm
                                      approval={approval}
                                      type="rejected"
                                    />
                                    <Tooltip label="View Details">
                                      <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        size="sm"
                                      >
                                        <IconEye size={14} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </Group>
                                </TableTd>
                              </TableTr>
                            );
                          })
                        )}
                      </TableTbody>
                    </Table>
                  </TableScrollContainer>

                  
                </Tabs>
              </Card>
            </Stack>
          </GridCol>

          {/* Right Column - Monitoring & Alerts */}
          <GridCol span={{ base: 12, lg: 5 }}>
            <Stack gap="md">
              {/* Large Transfers Card */}
              <Card withBorder shadow="sm" radius="md">
                <Group justify="space-between" mb="md">
                  <Title order={3}>Large Transfers Monitor</Title>
                </Group>

                {largeTransfers.length === 0 ? (
                  <Center py="xl">
                    <Stack align="center" gap="sm">
                      <IconCheck size={48} color="var(--mantine-color-green-6)" />
                      <Text c="dimmed">No large transfers</Text>
                      <Text size="sm" c="dimmed">No transfers over $10,000 in period</Text>
                    </Stack>
                  </Center>
                ) : (
                  <TableScrollContainer minWidth={300}>
                    <Table verticalSpacing="sm">
                      <TableThead>
                        <TableTr>
                          <TableTh>Customer</TableTh>
                          <TableTh>Amount</TableTh>
                          <TableTh>Date</TableTh>
                        </TableTr>
                      </TableThead>
                      <TableTbody>
                        {largeTransfers.map((transaction) => (
                          <TableTr key={transaction.id}>
                            <TableTd>
                              <Text size="sm">
                                {transaction.user.firstName} {transaction.user.lastName}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {transaction.account.accountNumber}
                              </Text>
                            </TableTd>
                            <TableTd>
                              <Text fw={600} c="red">
                                ${Math.abs(transaction.amount).toFixed(2)}
                              </Text>
                            </TableTd>
                            <TableTd>
                              <Text size="sm">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </Text>
                            </TableTd>
                          </TableTr>
                        ))}
                      </TableTbody>
                    </Table>
                  </TableScrollContainer>
                )}
              </Card>

              {/* Recent High-Value Transactions */}
              <Card withBorder shadow="sm" radius="md">
                <Title order={3} mb="md">Recent High-Value Transactions</Title>
                <TableScrollContainer minWidth={300}>
                  <Table verticalSpacing="xs">
                    <TableThead>
                      <TableTr>
                        <TableTh>Type</TableTh>
                        <TableTh>Amount</TableTh>
                        <TableTh>Status</TableTh>
                      </TableTr>
                    </TableThead>
                    <TableTbody>
                      {recentTransactions.map((transaction) => (
                        <TableTr key={transaction.id}>
                          <TableTd>
                            <Badge
                              color={
                                transaction.transactionType.type === 'transfer' ? 'blue' :
                                  transaction.transactionType.type === 'withdrawal' ? 'red' :
                                    transaction.transactionType.type === 'deposit' ? 'green' : 'gray'
                              }
                              variant="light"
                              size="xs"
                            >
                              {transaction.transactionType.type}
                            </Badge>
                          </TableTd>
                          <TableTd>
                            <Text
                              size="sm"
                              fw={600}
                              c={transaction.amount < 0 ? 'red' : 'green'}
                            >
                              ${Math.abs(transaction.amount).toFixed(2)}
                            </Text>
                          </TableTd>
                          <TableTd>
                            <Badge
                              color={
                                transaction.transactionStatus.status === 'completed' ? 'green' :
                                  transaction.transactionStatus.status === 'pending' ? 'yellow' : 'red'
                              }
                              size="xs"
                            >
                              {transaction.transactionStatus.status}
                            </Badge>
                          </TableTd>
                        </TableTr>
                      ))}
                    </TableTbody>
                  </Table>
                </TableScrollContainer>
              </Card>

              {/* System Alerts Card */}
              <Card withBorder shadow="sm" radius="md" bg="var(--mantine-color-red-light)">
                <Group justify="space-between" mb="md">
                  <Title order={3}>System Alerts</Title>
                  <Badge color="red" variant="filled">
                    {urgentPendingCount} Urgent
                  </Badge>
                </Group>
                <Stack gap="xs">
                  {paginatedApprovals.filter(a => {
                    const hours = Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60));
                    return hours > 24;
                  }).slice(0, 3).map((approval) => (
                    <Group key={approval.id} justify="space-between">
                      <Text size="sm">
                        Transfer pending for {Math.floor((Date.now() - new Date(approval.createdAt).getTime()) / (1000 * 60 * 60))}h
                      </Text>
                    </Group>
                  ))}
                  {urgentPendingCount > 3 && (
                    <Text size="sm" c="red" ta="center">
                      + {urgentPendingCount - 3} more urgent approvals
                    </Text>
                  )}
                </Stack>
              </Card>
            </Stack>
          </GridCol>
        </Grid>
      </Stack>
    </Container>
  );
}