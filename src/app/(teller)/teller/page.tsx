// app/dashboard/teller/page.tsx
import { getCurrentUser, requireRole } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Center,
    Container,
    Grid,
    GridCol,
    Group,
    Stack,
    Table,
    TableScrollContainer,
    TableTbody,
    TableTd,
    TableTh,
    TableThead,
    TableTr,
    Text,
    Title,
    Tooltip
} from '@mantine/core';
import {
    IconCheck,
    IconCurrencyDollar,
    IconEye,
    IconReceipt,
    IconTransfer,
    IconUserCheck
} from '@tabler/icons-react';
import { redirect } from 'next/navigation';
import ApproveTransferForm from './components/Approve/ApproveTransferForm';
import TellerStatsCard from './components/TellerStatsCard';

export default async function TellerDashboardPage() {
    // Check if user is teller, redirect if not
    try {
        await requireRole(['TELLER']);
    } catch {
        redirect('/auth/login');
    }

    // Fetch data in parallel
    const [
        pendingTransfers,
        pendingWithdrawals,
        recentTransactions,
        customerStats,
        pendingApprovalsCount,
        pendingWithdrawalsCount,
        user
    ] = await Promise.all([
        // Pending transfers (needing teller approval)
        prisma.approval.findMany({
            where: {
                status: {
                    status: 'pending',
                },
                approverRole: {
                    role: 'teller'
                }
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
                                email: true
                            }
                        }
                    }
                },
                status: true,
                approverRole: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        }),


        // Pending withdrawals (cash withdrawals that need teller processing)
        prisma.transaction.findMany({
            where: {
                transactionType: {
                    type: 'withdrawal'
                },
                transactionStatus: {
                    status: 'pending'
                }
            },
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
                transactionType: true,
                transactionStatus: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        }),

        // Recent transactions (for quick view)
        prisma.transaction.findMany({
            where: {
                OR: [
                    { transactionType: { type: 'transfer' } },
                    { transactionType: { type: 'withdrawal' } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
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

        // Customer statistics
        prisma.user.aggregate({
            _count: {
                _all: true
            },
            where: {
                role: 'CUSTOMER',
                status: 'ACTIVE'
            }
        }),

        prisma.approval.aggregate({
            _count: {
                _all: true
            },
            where: {
                status: {
                    status: 'pending',
                },
                approverRole: {
                    role: 'teller'
                }
            }
        }),
        prisma.transaction.aggregate({
            _count: {
                _all: true
            },
            where: {
                transactionType: {
                    type: 'withdrawal'
                },
                transactionStatus: {
                    status: 'pending'
                }
            },
        }),
        // Current user
        getCurrentUser()
    ]);

    // Calculate statistics
    const totalPendingApprovals = pendingApprovalsCount._count._all;
    const totalPendingWithdrawals = pendingWithdrawalsCount._count._all;
    const totalRecentTransactions = recentTransactions.length;
    const totalActiveCustomers = customerStats._count._all;

    // Get total value of pending transfers
    const totalPendingValue = pendingTransfers.reduce((sum, approval) => {
        return sum + Math.abs(approval.transaction.amount);
    }, 0);

    return (
        <Container fluid>
            <Stack gap="lg">
                {/* Welcome header */}
                <Group justify="space-between">
                    <div>
                        <Title order={1}>Teller Dashboard</Title>
                        <Text c="dimmed">
                            Welcome, {user?.firstName} {user?.lastName}
                        </Text>
                    </div>
                    <Group>
                        <Badge color="blue" size="lg" variant="light">
                            Teller: {user?.email}
                        </Badge>
                        <Badge color="green" size="lg">
                            Online
                        </Badge>
                    </Group>
                </Group>

                {/* Stats Overview Cards */}
                <Grid>
                    <GridCol span={{ base: 12, sm: 6 }}>
                        <TellerStatsCard
                            title="Pending Transfers"
                            value={totalPendingApprovals}
                            icon={IconTransfer}
                            color="orange"
                            description={`$${totalPendingValue.toLocaleString()} total value`}
                        />
                    </GridCol>
                    <GridCol span={{ base: 12, sm: 6 }}>
                        <TellerStatsCard
                            title="Pending Withdrawals"
                            value={totalPendingWithdrawals}
                            icon={IconCurrencyDollar}
                            color="red"
                            description="Awaiting cash processing"
                        />
                    </GridCol>
                    <GridCol span={{ base: 12, sm: 6 }}>
                        <TellerStatsCard
                            title="Active Customers"
                            value={totalActiveCustomers}
                            icon={IconUserCheck}
                            color="green"
                            description="Today's customers"
                        />
                    </GridCol>
                    <GridCol span={{ base: 12, sm: 6 }}>
                        <TellerStatsCard
                            title="Recent Transactions"
                            value={totalRecentTransactions}
                            icon={IconReceipt}
                            color="blue"
                            description="Last 24 hours"
                        />
                    </GridCol>
                </Grid>

                {/* Main Content Grid */}
                <Grid>
                    {/* Left Column - Pending Actions */}
                    <GridCol span={{ base: 12, lg: 6 }}>
                        <Stack gap="md">
                            {/* Pending Transfers Card */}
                            <Card withBorder shadow="sm" radius="md">
                                <Group justify="space-between" mb="md">
                                    <Title order={3}>Pending Transfers</Title>
                                    <Badge color="orange" variant="light">
                                        {totalPendingApprovals} waiting
                                    </Badge>
                                </Group>

                                {pendingTransfers.length === 0 ? (
                                    <Center py="xl">
                                        <Stack align="center" gap="sm">
                                            <IconCheck size={48} color="var(--mantine-color-green-6)" />
                                            <Text c="dimmed">No pending transfers</Text>
                                            <Text size="sm" c="dimmed">All transfers have been processed</Text>
                                        </Stack>
                                    </Center>
                                ) : (
                                    <TableScrollContainer minWidth={400}>
                                        <Table verticalSpacing="sm">
                                            <TableThead>
                                                <TableTr>
                                                    <TableTh>From</TableTh>
                                                    <TableTh>To</TableTh>
                                                    <TableTh>Amount</TableTh>
                                                    <TableTh>Actions</TableTh>
                                                </TableTr>
                                            </TableThead>
                                            <TableTbody>
                                                {pendingTransfers.map((approval) => (
                                                    <TableTr key={approval.id}>
                                                        <TableTd>
                                                            <Text size="sm" fw={500}>
                                                                {approval.transaction.fromAccount?.customer?.firstName}{' '}
                                                                {approval.transaction.fromAccount?.customer?.lastName}
                                                            </Text>
                                                            <Text size="xs" c="dimmed">
                                                                {approval.transaction.fromAccount?.accountNumber}
                                                            </Text>
                                                        </TableTd>
                                                        <TableTd>
                                                            <Text size="sm" fw={500}>
                                                                {approval.transaction.toAccount?.customer?.firstName}{' '}
                                                                {approval.transaction.toAccount?.customer?.lastName}
                                                            </Text>
                                                            <Text size="xs" c="dimmed">
                                                                {approval.transaction.toAccount?.accountNumber}
                                                            </Text>
                                                        </TableTd>
                                                        <TableTd>
                                                            <Text fw={600} c="blue">
                                                                ${Math.abs(approval.transaction.amount).toFixed(2)}
                                                            </Text>
                                                            <Text size="xs" c="dimmed">
                                                                {new Date(approval.createdAt).toLocaleTimeString()}
                                                            </Text>
                                                        </TableTd>
                                                        <TableTd>
                                                            <Group gap="xs">
                                                                <ApproveTransferForm
                                                                    approval={approval}
                                                                    type="approved"
                                                                />
                                                                <ApproveTransferForm
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
                                                ))}
                                            </TableTbody>
                                        </Table>
                                    </TableScrollContainer>
                                )}
                            </Card>

                            {/* Pending Withdrawals Card */}
                            <Card withBorder shadow="sm" radius="md">
                                <Group justify="space-between" mb="md">
                                    <Title order={3}>Pending Withdrawals</Title>
                                    <Badge color="red" variant="light">
                                        {totalPendingWithdrawals} waiting
                                    </Badge>
                                </Group>

                                {pendingWithdrawals.length === 0 ? (
                                    <Center py="xl">
                                        <Stack align="center" gap="sm">
                                            <IconCheck size={48} color="var(--mantine-color-green-6)" />
                                            <Text c="dimmed">No pending withdrawals</Text>
                                            <Text size="sm" c="dimmed">All withdrawals have been processed</Text>
                                        </Stack>
                                    </Center>
                                ) : (
                                    <TableScrollContainer minWidth={400}>
                                        <Table verticalSpacing="sm">
                                            <TableThead>
                                                <TableTr>
                                                    <TableTh>Customer</TableTh>
                                                    <TableTh>Account</TableTh>
                                                    <TableTh>Amount</TableTh>
                                                    <TableTh>Time</TableTh>
                                                    <TableTh>Actions</TableTh>
                                                </TableTr>
                                            </TableThead>
                                            <TableTbody>
                                                {pendingWithdrawals.map((transaction) => (
                                                    <TableTr key={transaction.id}>
                                                        <TableTd>
                                                            <Text size="sm" fw={500}>
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
                                                            <Text fw={600} c="red">
                                                                ${Math.abs(transaction.amount).toFixed(2)}
                                                            </Text>
                                                        </TableTd>
                                                        <TableTd>
                                                            <Text size="sm">
                                                                {new Date(transaction.createdAt).toLocaleTimeString()}
                                                            </Text>
                                                            <Text size="xs" c="dimmed">
                                                                {new Date(transaction.createdAt).toLocaleDateString()}
                                                            </Text>
                                                        </TableTd>
                                                        <TableTd>
                                                            <Group gap="xs">
                                                                <Tooltip label="Process Withdrawal">
                                                                    <ActionIcon
                                                                        variant="filled"
                                                                        color="green"
                                                                        size="sm"
                                                                    >
                                                                        <IconCheck size={14} />
                                                                    </ActionIcon>
                                                                </Tooltip>
                                                                <Tooltip label="View Details">
                                                                    <ActionIcon
                                                                        variant="subtle"
                                                                        color="blue"
                                                                        size="sm"
                                                                    >
                                                                        <IconEye size={14} />
                                                                    </ActionIcon>
                                                                </Tooltip>
                                                            </Group>
                                                        </TableTd>
                                                    </TableTr>
                                                ))}
                                            </TableTbody>
                                        </Table>
                                    </TableScrollContainer>
                                )}
                            </Card>
                        </Stack>
                    </GridCol>

                    {/* Right Column - Recent Activity & Quick Actions */}
                    <GridCol span={{ base: 12, lg: 6 }}>
                        <Stack gap="md">
                            {/* Recent Transactions Card */}
                            <Card withBorder shadow="sm" radius="md">
                                <Group justify="space-between" mb="md">
                                    <Title order={3}>Recent Activity</Title>
                                    <Button variant="subtle" size="xs">
                                        View All
                                    </Button>
                                </Group>

                                <TableScrollContainer minWidth={400}>
                                    <Table verticalSpacing="sm">
                                        <TableThead>
                                            <TableTr>
                                                <TableTh>Type</TableTh>
                                                <TableTh>Customer</TableTh>
                                                <TableTh>Amount</TableTh>
                                                <TableTh>Status</TableTh>
                                                <TableTh>Time</TableTh>
                                            </TableTr>
                                        </TableThead>
                                        <TableTbody>
                                            {recentTransactions.map((transaction) => (
                                                <TableTr key={transaction.id}>
                                                    <TableTd>
                                                        <Badge
                                                            color={
                                                                transaction.transactionType.type === 'transfer' ? 'blue' :
                                                                    transaction.transactionType.type === 'withdrawal' ? 'red' : 'gray'
                                                            }
                                                            variant="light"
                                                            size="sm"
                                                        >
                                                            {transaction.transactionType.type}
                                                        </Badge>
                                                    </TableTd>
                                                    <TableTd>
                                                        <Text size="sm">
                                                            {transaction.user.firstName} {transaction.user.lastName}
                                                        </Text>
                                                        <Text size="xs" c="dimmed">
                                                            {transaction.account.accountNumber}
                                                        </Text>
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
                                                            size="sm"
                                                        >
                                                            {transaction.transactionStatus.status}
                                                        </Badge>
                                                    </TableTd>
                                                    <TableTd>
                                                        <Text size="sm">
                                                            {new Date(transaction.createdAt).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </Text>
                                                    </TableTd>
                                                </TableTr>
                                            ))}
                                        </TableTbody>
                                    </Table>
                                </TableScrollContainer>
                            </Card>


                            {/* Daily Summary Card */}
                            <Card withBorder shadow="sm" radius="md">
                                <Title order={3} mb="md">Today&apos;s Summary</Title>
                                <Stack gap="xs">
                                    <Group justify="space-between">
                                        <Text c="dimmed">Total Transactions</Text>
                                        <Text fw={500}>{totalRecentTransactions}</Text>
                                    </Group>
                                    <Group justify="space-between">
                                        <Text c="dimmed">Pending Approvals</Text>
                                        <Text fw={500} c="orange">{totalPendingApprovals}</Text>
                                    </Group>
                                    <Group justify="space-between">
                                        <Text c="dimmed">Pending Withdrawals</Text>
                                        <Text fw={500} c="red">{totalPendingWithdrawals}</Text>
                                    </Group>
                                    <Group justify="space-between">
                                        <Text c="dimmed">Customers Served</Text>
                                        <Text fw={500} c="green">{totalActiveCustomers}</Text>
                                    </Group>
                                </Stack>
                            </Card>
                        </Stack>
                    </GridCol>
                </Grid>
            </Stack>
        </Container>
    );
}