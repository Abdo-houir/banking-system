// components/customer/CustomerDashboard.tsx
'use client';

import { Account, Notification, Transaction } from '@/generated/prisma/client';
import { JwtPayload } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import {
    Alert,
    Avatar,
    Badge,
    Button,
    Card,
    Center,
    Container,
    Grid,
    Group,
    Paper,
    Progress,
    ScrollArea,
    SimpleGrid,
    Stack,
    Tabs,
    Text,
    ThemeIcon,
    Title
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconBell,
    IconBuildingBank,
    IconChartBar,
    IconCheck,
    IconCreditCard,
    IconHistory,
    IconInfoCircle,
    IconPlus,
    IconQrcode,
    IconReceipt,
    IconShield,
    IconTransfer,
    IconTrendingDown,
    IconTrendingUp,
    IconWallet
} from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import CreateAccountModal from './CreateAccountModal';
import EmptyAccountsState from './EmptyAccountsState';
import DepositModal from './transactions/DepositModal';
import PaymentModal from './transactions/PaymentModal';
import TransferModal from './transactions/TransferModal';
import WithdrawalModal from './transactions/WithdrawalModal';

interface CustomerDashboardProps {
    user: JwtPayload;
    accounts: (Account & {
        accountType: { type: string };
        accountStatus: { status: string };
        _count: { transactions: number };
    })[];
    totalBalance: number;
    recentTransactions: (Transaction & {
        transactionType: { type: string };
        transactionStatus: { status: string };
        fromAccount?: { accountNumber: string } | null; // Optional and nullable
        toAccount?: { accountNumber: string } | null; // Optional and nullable
    })[];
    notifications: Notification[];
}

export default function CustomerDashboard({
    user,
    accounts,
    totalBalance,
    recentTransactions,
    notifications,
}: CustomerDashboardProps) {
    const [createAccountModalOpened, { open: openCreateAccountModal, close: closeCreateAccountModal }] = useDisclosure(false);
    const [transferModalOpened, { open: openTransferModal, close: closeTransferModal }] = useDisclosure(false);
    const [depositModalOpened, { open: openDepositModal, close: closeDepositModal }] = useDisclosure(false);
    const [withdrawalModalOpened, { open: openWithdrawalModal, close: closeWithdrawalModal }] = useDisclosure(false);
    const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Quick action buttons
    const quickActions = [
        {
            icon: <IconTransfer size={20} />,
            label: 'Transfer',
            color: 'blue',
            action: openTransferModal,
            disabled: accounts.length < 1,
        },
        {
            icon: <IconReceipt size={20} />,
            label: 'Deposit',
            color: 'green',
            action: openDepositModal,
            disabled: accounts.length < 1,
        },
        {
            icon: <IconCreditCard size={20} />,
            label: 'Withdraw',
            color: 'red',
            action: openWithdrawalModal,
            disabled: accounts.length < 1,
        },
        {
            icon: <IconQrcode size={20} />,
            label: 'Pay',
            color: 'orange',
            action: openPaymentModal,
            disabled: accounts.length < 1,
        },
    ];

    // If no accounts, show empty state
    if (accounts.length === 0) {
        return (
            <Container size="xl" py="xl">
                <EmptyAccountsState
                    onOpenCreateAccount={openCreateAccountModal}
                    userName={user.firstName}
                />

                <CreateAccountModal
                    opened={createAccountModalOpened}
                    onClose={closeCreateAccountModal}
                />
            </Container>
        );
    }

    // Calculate statistics
    const activeAccounts = accounts.filter(acc => acc.accountStatus.status === 'active');
    const totalTransactions = accounts.reduce((sum, acc) => sum + acc._count.transactions, 0);
    const savingsBalance = accounts
        .filter(acc => acc.accountType.type === 'savings')
        .reduce((sum, acc) => sum + acc.balance, 0);
    const checkingBalance = accounts
        .filter(acc => acc.accountType.type === 'checking')
        .reduce((sum, acc) => sum + acc.balance, 0);
    const loanBalance = accounts
        .filter(acc => acc.accountType.type === 'loan')
        .reduce((sum, acc) => sum + acc.balance, 0);

    // Calculate monthly growth (mock data)
    const monthlyGrowth = 2.5; // percentage

    return (
        <Container size="xl" py="xl">
            {/* Header */}
            <Grid gutter="xl" mb="xl">
                <Grid.Col span={12}>
                    <Group justify="space-between" align="center">
                        <div>
                            <Title order={2}>Welcome back, {user.firstName}!</Title>
                            <Text c="dimmed">Here is your financial overview</Text>
                        </div>
                        <Group>
                            <Button
                                leftSection={<IconPlus size={16} />}
                                onClick={openCreateAccountModal}
                                variant="light"
                                color="blue"
                            >
                                Open New Account
                            </Button>
                            <Button
                                component={Link}
                                href="/customer/settings"
                                variant="default"
                                leftSection={<IconShield size={16} />}
                            >
                                Security
                            </Button>
                        </Group>
                    </Group>
                </Grid.Col>
            </Grid>

            {/* Stats Cards */}
            <Grid gutter="md" mb="xl">
                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                    <Card withBorder radius="md" padding="xl">
                        <Group justify="space-between">
                            <div>
                                <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
                                    Total Balance
                                </Text>
                                <Text fz="xl" fw={700}>
                                    {formatCurrency(totalBalance)}
                                </Text>
                            </div>
                            <ThemeIcon size="lg" variant="light" color="blue">
                                <IconWallet size={24} />
                            </ThemeIcon>
                        </Group>
                        <Progress
                            value={100}
                            mt="md"
                            size="xs"
                            radius="xl"
                            color={monthlyGrowth >= 0 ? 'blue' : 'red'}
                        />
                        <Text fz="xs" c="dimmed" mt="md">
                            {monthlyGrowth >= 0 ? `+${monthlyGrowth}%` : `${monthlyGrowth}%`} from last month
                        </Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                    <Card withBorder radius="md" padding="xl">
                        <Group justify="space-between">
                            <div>
                                <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
                                    Active Accounts
                                </Text>
                                <Text fz="xl" fw={700}>
                                    {activeAccounts.length}
                                </Text>
                            </div>
                            <ThemeIcon size="lg" variant="light" color="green">
                                <IconBuildingBank size={24} />
                            </ThemeIcon>
                        </Group>
                        <Progress
                            value={100}
                            mt="md"
                            size="xs"
                            radius="xl"
                            color="green"
                        />
                        <Text fz="xs" c="dimmed" mt="md">
                            {accounts.length} total • {savingsBalance > 0 ? 'Savings' : ''} {checkingBalance > 0 ? 'Checking' : ''} {loanBalance > 0 ? 'Loan' : ''}
                        </Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                    <Card withBorder radius="md" padding="xl">
                        <Group justify="space-between">
                            <div>
                                <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
                                    Total Transactions
                                </Text>
                                <Text fz="xl" fw={700}>
                                    {totalTransactions}
                                </Text>
                            </div>
                            <ThemeIcon size="lg" variant="light" color="orange">
                                <IconHistory size={24} />
                            </ThemeIcon>
                        </Group>
                        <Progress
                            value={100}
                            mt="md"
                            size="xs"
                            radius="xl"
                            color="orange"
                        />
                        <Text fz="xs" c="dimmed" mt="md">
                            This month: {Math.floor(totalTransactions / 12)}
                        </Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                    <Card withBorder radius="md" padding="xl">
                        <Group justify="space-between">
                            <div>
                                <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
                                    Notifications
                                </Text>
                                <Text fz="xl" fw={700}>
                                    {notifications.length}
                                </Text>
                            </div>
                            <ThemeIcon size="lg" variant="light" color="red">
                                <IconBell size={24} />
                            </ThemeIcon>
                        </Group>
                        <Progress
                            value={100}
                            mt="md"
                            size="xs"
                            radius="xl"
                            color="red"
                        />
                        <Text fz="xs" c="dimmed" mt="md">
                            {notifications.length > 0 ? 'Unread alerts' : 'All caught up'}
                        </Text>
                    </Card>
                </Grid.Col>
            </Grid>

            {/* Main Content */}
            <Grid gutter="xl">
                {/* Left Column - Accounts & Quick Actions */}
                <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Tabs value={activeTab} onChange={(value) => setActiveTab(value as string)}>
                        <Tabs.List>
                            <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
                                Overview
                            </Tabs.Tab>
                            <Tabs.Tab value="accounts" leftSection={<IconWallet size={16} />}>
                                Accounts
                            </Tabs.Tab>
                            <Tabs.Tab value="activity" leftSection={<IconHistory size={16} />}>
                                Activity
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="overview" pt="md">
                            <Grid gutter="md">
                                {/* Accounts Summary */}
                                <Grid.Col span={12}>
                                    <Card withBorder radius="md">
                                        <Group justify="space-between" mb="md">
                                            <Title order={4}>Your Accounts</Title>
                                            <Badge color="blue" variant="light">
                                                {activeAccounts.length} Active
                                            </Badge>
                                        </Group>

                                        <Stack gap="md">
                                            {accounts.map((account) => (
                                                <AccountCard key={account.id} account={account} />
                                            ))}
                                        </Stack>
                                    </Card>
                                </Grid.Col>

                                {/* Quick Actions */}
                                <Grid.Col span={12}>
                                    <Card withBorder radius="md">
                                        <Title order={4} mb="md">Quick Actions</Title>
                                        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                                            {quickActions.map((action, index) => (
                                                <Button
                                                    key={index}
                                                    leftSection={action.icon}
                                                    variant="light"
                                                    color={action.color}
                                                    onClick={action.action}
                                                    disabled={action.disabled}
                                                    fullWidth
                                                    h={80}
                                                >
                                                    <Stack gap={2} align="center">
                                                        <Text size="sm">{action.label}</Text>
                                                        {action.disabled && (
                                                            <Text size="xs" c="dimmed">Requires account</Text>
                                                        )}
                                                    </Stack>
                                                </Button>
                                            ))}
                                        </SimpleGrid>
                                    </Card>
                                </Grid.Col>
                            </Grid>
                        </Tabs.Panel>

                        <Tabs.Panel value="accounts" pt="md">
                            <Card withBorder radius="md">
                                <Title order={4} mb="md">All Accounts</Title>
                                <Stack gap="md">
                                    {accounts.map((account) => (
                                        <DetailedAccountCard key={account.id} account={account} />
                                    ))}
                                </Stack>
                            </Card>
                        </Tabs.Panel>

                        <Tabs.Panel value="activity" pt="md">
                            <Card withBorder radius="md">
                                <Title order={4} mb="md">Recent Transactions</Title>
                                <ScrollArea h={400}>
                                    <Stack gap="xs">
                                        {recentTransactions.map((transaction) => (
                                            <TransactionItem key={transaction.id} transaction={transaction} />
                                        ))}
                                        {recentTransactions.length === 0 && (
                                            <Center h={200}>
                                                <Stack align="center" gap="sm">
                                                    <IconHistory size={48} color="gray" />
                                                    <Text c="dimmed">No transactions yet</Text>
                                                </Stack>
                                            </Center>
                                        )}
                                    </Stack>
                                </ScrollArea>
                            </Card>
                        </Tabs.Panel>
                    </Tabs>
                </Grid.Col>

                {/* Right Column - Notifications & Insights */}
                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Stack gap="md">
                        {/* Notifications */}
                        <Card withBorder radius="md">
                            <Group justify="space-between" mb="md">
                                <Title order={4}>Notifications</Title>
                                <Badge color="red" variant="light">
                                    {notifications.length} New
                                </Badge>
                            </Group>

                            <ScrollArea h={300}>
                                <Stack gap="md">
                                    {notifications.map((notification) => (
                                        <Alert
                                            key={notification.id}
                                            variant="light"
                                            color="blue"
                                            title={notification.title}
                                            icon={<IconInfoCircle size={16} />}
                                        >
                                            <Text size="sm">{notification.message}</Text>
                                            <Text size="xs" c="dimmed" mt={4}>
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </Text>
                                        </Alert>
                                    ))}

                                    {notifications.length === 0 && (
                                        <Center h={100}>
                                            <Stack align="center" gap="sm">
                                                <IconBell size={32} color="gray" />
                                                <Text c="dimmed">No new notifications</Text>
                                            </Stack>
                                        </Center>
                                    )}
                                </Stack>
                            </ScrollArea>
                        </Card>

                        {/* Balance Distribution */}
                        <Card withBorder radius="md">
                            <Title order={4} mb="md">Balance Distribution</Title>

                            <Stack gap="md">
                                {savingsBalance > 0 && (
                                    <div>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="sm">Savings</Text>
                                            <Text size="sm" fw={500}>{formatCurrency(savingsBalance)}</Text>
                                        </Group>
                                        <Progress
                                            value={(savingsBalance / totalBalance) * 100}
                                            color="green"
                                            size="lg"
                                        />
                                    </div>
                                )}

                                {checkingBalance > 0 && (
                                    <div>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="sm">Checking</Text>
                                            <Text size="sm" fw={500}>{formatCurrency(checkingBalance)}</Text>
                                        </Group>
                                        <Progress
                                            value={(checkingBalance / totalBalance) * 100}
                                            color="blue"
                                            size="lg"
                                        />
                                    </div>
                                )}

                                {loanBalance > 0 && (
                                    <div>
                                        <Group justify="space-between" mb={4}>
                                            <Text size="sm">Loan Balance</Text>
                                            <Text size="sm" fw={500}>{formatCurrency(Math.abs(loanBalance))}</Text>
                                        </Group>
                                        <Progress
                                            value={(Math.abs(loanBalance) / totalBalance) * 100}
                                            color="red"
                                            size="lg"
                                        />
                                    </div>
                                )}
                            </Stack>
                        </Card>

                        {/* Quick Tips */}
                        <Card withBorder radius="md">
                            <Title order={4} mb="md">Quick Tips</Title>
                            <Stack gap="md">
                                <Alert color="green" icon={<IconTrendingUp size={16} />}>
                                    <Text size="sm">Consider opening a savings account to earn interest on your deposits.</Text>
                                </Alert>
                                <Alert color="blue" icon={<IconShield size={16} />}>
                                    <Text size="sm">Enable 2FA for added security on your account.</Text>
                                </Alert>
                                <Alert color="orange" icon={<IconInfoCircle size={16} />}>
                                    <Text size="sm">Review your monthly statements regularly for any unauthorized transactions.</Text>
                                </Alert>
                            </Stack>
                        </Card>
                    </Stack>
                </Grid.Col>
            </Grid>

            {/* Modals */}
            <CreateAccountModal
                opened={createAccountModalOpened}
                onClose={closeCreateAccountModal}
            />

            <TransferModal
                opened={transferModalOpened}
                onClose={closeTransferModal}
                accounts={accounts.map(acc => ({
                    id: acc.id,
                    accountNumber: acc.accountNumber,
                    balance: acc.balance,
                    type: acc.accountType.type,
                }))}
                onSuccess={() => window.location.reload()}
            />

            <DepositModal
                opened={depositModalOpened}
                onClose={closeDepositModal}
                accounts={accounts.map(acc => ({
                    id: acc.id,
                    accountNumber: acc.accountNumber,
                    balance: acc.balance,
                    type: acc.accountType.type,
                }))}
                onSuccess={() => window.location.reload()}
            />

            <WithdrawalModal
                opened={withdrawalModalOpened}
                onClose={closeWithdrawalModal}
                accounts={accounts.map(acc => ({
                    id: acc.id,
                    accountNumber: acc.accountNumber,
                    balance: acc.balance,
                    type: acc.accountType.type,
                }))}
                onSuccess={() => window.location.reload()}
            />

            <PaymentModal
                opened={paymentModalOpened}
                onClose={closePaymentModal}
                accounts={accounts.map(acc => ({
                    id: acc.id,
                    accountNumber: acc.accountNumber,
                    balance: acc.balance,
                    type: acc.accountType.type,
                }))}
                onSuccess={() => window.location.reload()}
            />
        </Container>
    );
}

// Sub-components
function AccountCard({ account }: {
    account: Account & {
        accountType: { type: string };
        accountStatus: { status: string };
    }
}) {
    const isLoan = account.accountType.type === 'loan';
    const isNegative = account.balance < 0;

    return (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
                <div>
                    <Group gap="xs" mb={4}>
                        <Text fw={600}>{account.accountNumber}</Text>
                        <Badge
                            color={
                                account.accountStatus.status === 'active' ? 'green' :
                                    account.accountStatus.status === 'pending' ? 'yellow' : 'red'
                            }
                            variant="light"
                            size="sm"
                        >
                            {account.accountStatus.status}
                        </Badge>
                    </Group>
                    <Text size="sm" c="dimmed" tt="uppercase">
                        {account.accountType.type} Account
                    </Text>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <Text
                        fz="xl"
                        fw={700}
                        c={isLoan || isNegative ? 'red' : 'green'}
                    >
                        {isLoan ? `-${formatCurrency(Math.abs(account.balance))}` : formatCurrency(account.balance)}
                    </Text>
                    {isLoan && (
                        <Text size="xs" c="dimmed">
                            Monthly: {formatCurrency(account.monthlyPayment || 0)}
                        </Text>
                    )}
                </div>
            </Group>

            <Group gap="xs" mt="md">
                <Button
                    variant="light"
                    size="xs"
                    component={Link}
                    href={`/customer/accounts/${account.id}`}
                >
                    View Details
                </Button>
                <Button
                    variant="subtle"
                    size="xs"
                    component={Link}
                    href={`/customer/accounts/${account.id}/transactions`}
                >
                    Transactions
                </Button>
            </Group>
        </Paper>
    );
}

function DetailedAccountCard({ account }: {
    account: Account & {
        accountType: { type: string };
        accountStatus: { status: string };
    }
}) {
    const isLoan = account.accountType.type === 'loan';
    const isNegative = account.balance < 0;

    const getAccountFeatures = () => {
        if (account.accountType.type === 'savings') {
            return [
                `Interest Rate: ${account.interestRate || 1.5}%`,
                `Monthly Withdrawals: ${account.monthlyWithdrawalLimit || 6}`,
                'No monthly fees',
            ];
        } else if (account.accountType.type === 'checking') {
            return [
                `Overdraft Limit: ${formatCurrency(account.overdraftLimit || 0)}`,
                'Unlimited transactions',
                'Free debit card',
            ];
        } else {
            return [
                `Monthly Payment: ${formatCurrency(account.monthlyPayment || 0)}`,
                `Interest Rate: ${account.interestRate}%`,
                `Due Date: ${account.dueDate ? new Date(account.dueDate).toLocaleDateString() : 'N/A'}`,
            ];
        }
    };

    const features = getAccountFeatures();

    return (
        <Card withBorder radius="md" p="md">
            <Group justify="space-between" align="flex-start">
                <div>
                    <Group gap="xs" mb={4}>
                        <Text fw={600} size="lg">{account.accountNumber}</Text>
                        <Badge
                            color={
                                account.accountStatus.status === 'active' ? 'green' :
                                    account.accountStatus.status === 'pending' ? 'yellow' : 'red'
                            }
                            variant="light"
                        >
                            {account.accountStatus.status}
                        </Badge>
                        <Badge color="blue" variant="outline">
                            {account.accountType.type.toUpperCase()}
                        </Badge>
                    </Group>

                    <Text fz="xl" fw={700} mb="md" c={isLoan || isNegative ? 'red' : 'green'}>
                        {isLoan ? `-${formatCurrency(Math.abs(account.balance))}` : formatCurrency(account.balance)}
                    </Text>

                    <Stack gap={4}>
                        {features.map((feature, idx) => (
                            <Group key={idx} gap="xs">
                                <IconCheck size={12} color="green" />
                                <Text size="sm">{feature}</Text>
                            </Group>
                        ))}
                    </Stack>
                </div>

                <Stack gap="xs">
                    <Button
                        variant="light"
                        size="sm"
                        component={Link}
                        href={`/customer/accounts/${account.id}`}
                    >
                        Manage
                    </Button>
                    <Button
                        variant="subtle"
                        size="sm"
                        component={Link}
                        href={`/customer/accounts/${account.id}/transactions`}
                    >
                        History
                    </Button>
                    {isLoan && (
                        <Button
                            variant="outline"
                            size="sm"
                            color="orange"
                            component={Link}
                            href={`/customer/loans/${account.id}`}
                        >
                            Pay Loan
                        </Button>
                    )}
                </Stack>
            </Group>

            <Text size="xs" c="dimmed" mt="md">
                Opened on {new Date(account.createdAt).toLocaleDateString()}
            </Text>
        </Card>
    );
}

function TransactionItem({ transaction }: {
    transaction: Transaction & {
        transactionType: { type: string };
        transactionStatus: { status: string };
        fromAccount?: { accountNumber: string } | null;
        toAccount?: { accountNumber: string } | null;
    }
}) {
    const isNegative = transaction.amount < 0;
    const isTransfer = transaction.transactionType.type === 'transfer';
    const isPayment = transaction.transactionType.type === 'payment';

    const getIcon = () => {
        if (isTransfer) return <IconTransfer size={16} />;
        if (isPayment) return <IconReceipt size={16} />;
        if (transaction.amount > 0) return <IconTrendingUp size={16} />;
        return <IconTrendingDown size={16} />;
    };

    const getDescription = () => {
        if (isTransfer) {
            return `Transfer ${isNegative ? 'to' : 'from'} ${isNegative ? transaction.toAccount?.accountNumber : transaction.fromAccount?.accountNumber
                }`;
        }
        return /* transaction.description || */ transaction.transactionType.type;
    };

    return (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
                <Group gap="sm">
                    <Avatar size="sm" color={isNegative ? 'red' : 'green'}>
                        {getIcon()}
                    </Avatar>
                    <div>
                        <Text fw={500} size="sm">{getDescription()}</Text>
                        <Text size="xs" c="dimmed">
                            {new Date(transaction.createdAt).toLocaleDateString()} • {transaction.referenceNumber}
                        </Text>
                    </div>
                </Group>

                <div style={{ textAlign: 'right' }}>
                    <Text fw={600} c={isNegative ? 'red' : 'green'}>
                        {isNegative ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                    </Text>
                    <Badge
                        size="sm"
                        color={
                            transaction.transactionStatus.status === 'completed' ? 'green' :
                                transaction.transactionStatus.status === 'pending' ? 'yellow' : 'red'
                        }
                        variant="light"
                    >
                        {transaction.transactionStatus.status}
                    </Badge>
                </div>
            </Group>
        </Paper>
    );
}