// components/accounts/AccountDetails.tsx
'use client';

import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
    ActionIcon,
    Alert,
    Avatar,
    Badge,
    Button,
    Card,
    Center,
    Container,
    CopyButton,
    Grid,
    Group,
    Modal,
    Paper,
    ScrollArea,
    SimpleGrid,
    Stack,
    Table,
    Tabs,
    Text,
    ThemeIcon,
    Title,
    Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconBell,
    IconCalendar,
    IconCash,
    IconChartBar,
    IconCheck,
    IconClock,
    IconCopy,
    IconCreditCard,
    IconCurrencyDollar,
    IconDownload,
    IconEye,
    IconEyeOff,
    IconHistory,
    IconInfoCircle,
    IconLock,
    IconPercentage,
    IconPrinter,
    IconQrcode,
    IconReceipt,
    IconReceipt2,
    IconRefresh,
    IconSettings,
    IconShare,
    IconTransfer,
    IconTrendingDown,
    IconTrendingUp,
    IconX
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DepositModal from '../transactions/DepositModal';
import PaymentModal from '../transactions/PaymentModal';
import TransferModal from '../transactions/TransferModal';
import WithdrawalModal from '../transactions/WithdrawalModal';

interface AccountDetailsProps {
    account: any; // Using any for simplicity, should be properly typed
    recentTransactions: any[];
    accountTransactions: any[];
    statistics: {
        totalTransactions: number;
        totalDeposits: number;
        totalWithdrawals: number;
        monthlyStats: any[];
    };
}

export default function AccountDetails({
    account,
    recentTransactions,
    accountTransactions,
    statistics,
}: AccountDetailsProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [showBalance, setShowBalance] = useState(true);
    const [loading, setLoading] = useState(false);

    // Modal states
    const [transferModalOpened, { open: openTransferModal, close: closeTransferModal }] = useDisclosure(false);
    const [depositModalOpened, { open: openDepositModal, close: closeDepositModal }] = useDisclosure(false);
    const [withdrawalModalOpened, { open: openWithdrawalModal, close: closeWithdrawalModal }] = useDisclosure(false);
    const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false);
    const [closeAccountModalOpened, { open: openCloseAccountModal, close: closeCloseAccountModal }] = useDisclosure(false);

    const isLoanAccount = account.accountType.type === 'loan';
    const isSavingsAccount = account.accountType.type === 'savings';
    const isCheckingAccount = account.accountType.type === 'checking';
    const isActive = account.accountStatus.status === 'active';

    // Quick actions based on account type
    const quickActions = [
        {
            icon: <IconTransfer size={20} />,
            label: 'Transfer',
            color: 'blue',
            action: openTransferModal,
            disabled: !isActive || (isLoanAccount && account.balance >= 0),
            description: isLoanAccount ? 'Cannot transfer from loan account' : 'Send money',
        },
        {
            icon: <IconReceipt size={20} />,
            label: 'Deposit',
            color: 'green',
            action: openDepositModal,
            disabled: !isActive || isLoanAccount,
            description: isLoanAccount ? 'Cannot deposit to loan account' : 'Add funds',
        },
        {
            icon: <IconCash size={20} />,
            label: 'Withdraw',
            color: 'red',
            action: openWithdrawalModal,
            disabled: !isActive || isLoanAccount || account.balance <= 0,
            description: isLoanAccount ? 'Cannot withdraw from loan account' : 'Take out money',
        },
        {
            icon: <IconReceipt2 size={20} />,
            label: 'Pay Bill',
            color: 'orange',
            action: openPaymentModal,
            disabled: !isActive || (isLoanAccount && account.balance >= 0),
            description: isLoanAccount ? 'Make loan payment' : 'Pay bills',
        },
    ];

    // Account features based on type
    const getAccountFeatures = () => {
        const features = [];

        if (isSavingsAccount) {
            features.push(
                { icon: <IconPercentage size={16} />, label: 'Interest Rate', value: `${account.interestRate || 1.5}% APY` },
                { icon: <IconClock size={16} />, label: 'Withdrawal Limit', value: `${account.monthlyWithdrawalLimit || 6}/month` },
                { icon: <IconCurrencyDollar size={16} />, label: 'Minimum Balance', value: 'None' }
            );
        } else if (isCheckingAccount) {
            features.push(
                { icon: <IconCurrencyDollar size={16} />, label: 'Overdraft Limit', value: formatCurrency(account.overdraftLimit || 500) },
                { icon: <IconCreditCard size={16} />, label: 'Transaction Limit', value: 'Unlimited' },
                { icon: <IconPercentage size={16} />, label: 'Interest Rate', value: `${account.interestRate || 0.1}% APY` }
            );
        } else if (isLoanAccount) {
            features.push(
                { icon: <IconCurrencyDollar size={16} />, label: 'Loan Amount', value: formatCurrency(Math.abs(account.loanAmount || 0)) },
                { icon: <IconPercentage size={16} />, label: 'Interest Rate', value: `${account.interestRate}%` },
                { icon: <IconCalendar size={16} />, label: 'Monthly Payment', value: formatCurrency(account.monthlyPayment || 0) },
                { icon: <IconCalendar size={16} />, label: 'Next Due Date', value: account.dueDate ? formatDate(account.dueDate) : 'N/A' }
            );
        }

        return features;
    };

    const handleRefresh = async () => {
        setLoading(true);
        router.refresh();
        setTimeout(() => setLoading(false), 1000);
    };

    const handleCloseAccount = async () => {
        // Implement close account logic
        notifications.show({
            title: 'Feature Coming Soon',
            message: 'Account closure functionality will be available soon',
            color: 'blue',
        });
        closeCloseAccountModal();
    };

    const accountFeatures = getAccountFeatures();

    return (
        <Container size="xl" py="xl">
            {/* Header */}
            <Grid gutter="xl" mb="xl">
                <Grid.Col span={12}>
                    <Group justify="space-between" align="center">
                        <div>
                            <Group gap="sm">
                                <Title order={2}>
                                    {account.accountNumber}
                                </Title>
                                <Badge
                                    color={
                                        account.accountStatus.status === 'active' ? 'green' :
                                            account.accountStatus.status === 'pending' ? 'yellow' : 'red'
                                    }
                                    variant="light"
                                    size="lg"
                                >
                                    {account.accountStatus.status.toUpperCase()}
                                </Badge>
                                <Badge color="blue" variant="outline" size="lg">
                                    {account.accountType.type.toUpperCase()}
                                </Badge>
                            </Group>
                            <Text c="dimmed">
                                {account.customer.firstName} {account.customer.lastName} • Opened {formatDate(account.createdAt)}
                            </Text>
                        </div>

                        <Group>
                            <Button
                                variant="light"
                                leftSection={<IconRefresh size={16} />}
                                onClick={handleRefresh}
                                loading={loading}
                            >
                                Refresh
                            </Button>
                            <Button
                                variant="default"
                                leftSection={<IconSettings size={16} />}
                                component={Link}
                                href={`/customer/accounts/${account.id}/settings`}
                            >
                                Settings
                            </Button>
                        </Group>
                    </Group>
                </Grid.Col>
            </Grid>

            {/* Balance Card */}
            <Card withBorder radius="md" p="xl" mb="xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Group justify="space-between" align="center">
                    <div>
                        <Text c="white" size="sm" fw={500}>Current Balance</Text>
                        <Group gap="xs" align="center" mt={4}>
                            <Title order={1} c="white">
                                {showBalance ? (
                                    isLoanAccount ? `-${formatCurrency(Math.abs(account.balance))}` : formatCurrency(account.balance)
                                ) : (
                                    '•••••••'
                                )}
                            </Title>
                            <ActionIcon
                                variant="subtle"
                                color="white"
                                onClick={() => setShowBalance(!showBalance)}
                                size="sm"
                            >
                                {showBalance ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                            </ActionIcon>
                        </Group>
                        <Text c="white" size="sm" mt="md">
                            Available: {showBalance ? formatCurrency(account.balance + (account.overdraftLimit || 0)) : '•••••••'}
                            {isLoanAccount && ` • Remaining: ${formatCurrency(Math.abs(account.balance))}`}
                        </Text>
                    </div>

                    <Stack align="flex-end" gap="xs">
                        <CopyButton value={account.accountNumber}>
                            {({ copied, copy }) => (
                                <Button
                                    variant="white"
                                    size="sm"
                                    leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                    onClick={copy}
                                >
                                    {copied ? 'Copied' : 'Copy Account Number'}
                                </Button>
                            )}
                        </CopyButton>
                        <Button
                            variant="white"
                            size="sm"
                            leftSection={<IconQrcode size={16} />}
                        >
                            Show QR Code
                        </Button>
                    </Stack>
                </Group>
            </Card>

            {/* Main Content */}
            <Grid gutter="xl">
                {/* Left Column */}
                <Grid.Col span={{ base: 12, lg: 8 }}>
                    <Tabs value={activeTab} onChange={(value) => setActiveTab(value as string)}>
                        <Tabs.List>
                            <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
                                Overview
                            </Tabs.Tab>
                            <Tabs.Tab value="transactions" leftSection={<IconHistory size={16} />}>
                                Transactions
                            </Tabs.Tab>
                            <Tabs.Tab value="details" leftSection={<IconInfoCircle size={16} />}>
                                Account Details
                            </Tabs.Tab>
                        </Tabs.List>

                        {/* Overview Tab */}
                        <Tabs.Panel value="overview" pt="md">
                            <Grid gutter="md">
                                {/* Quick Actions */}
                                <Grid.Col span={12}>
                                    <Card withBorder radius="md">
                                        <Title order={4} mb="md">Quick Actions</Title>
                                        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                                            {quickActions.map((action, index) => (
                                                <Tooltip
                                                    key={index}
                                                    label={action.disabled ? action.description : action.label}
                                                    disabled={!action.disabled}
                                                >
                                                    <Button
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
                                                                <Text size="xs" c="dimmed">{action.description}</Text>
                                                            )}
                                                        </Stack>
                                                    </Button>
                                                </Tooltip>
                                            ))}
                                        </SimpleGrid>
                                    </Card>
                                </Grid.Col>

                                {/* Statistics */}
                                <Grid.Col span={12}>
                                    <Card withBorder radius="md">
                                        <Title order={4} mb="md">Account Statistics</Title>
                                        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                                            <Paper withBorder p="md" radius="md">
                                                <Group>
                                                    <ThemeIcon size={40} radius="md" variant="light" color="green">
                                                        <IconTrendingUp size={24} />
                                                    </ThemeIcon>
                                                    <div>
                                                        <Text fz="xs" c="dimmed">Total Deposits</Text>
                                                        <Text fz="lg" fw={700}>{formatCurrency(statistics.totalDeposits)}</Text>
                                                    </div>
                                                </Group>
                                            </Paper>

                                            <Paper withBorder p="md" radius="md">
                                                <Group>
                                                    <ThemeIcon size={40} radius="md" variant="light" color="red">
                                                        <IconTrendingDown size={24} />
                                                    </ThemeIcon>
                                                    <div>
                                                        <Text fz="xs" c="dimmed">Total Withdrawals</Text>
                                                        <Text fz="lg" fw={700}>{formatCurrency(statistics.totalWithdrawals)}</Text>
                                                    </div>
                                                </Group>
                                            </Paper>

                                            <Paper withBorder p="md" radius="md">
                                                <Group>
                                                    <ThemeIcon size={40} radius="md" variant="light" color="blue">
                                                        <IconHistory size={24} />
                                                    </ThemeIcon>
                                                    <div>
                                                        <Text fz="xs" c="dimmed">Total Transactions</Text>
                                                        <Text fz="lg" fw={700}>{statistics.totalTransactions}</Text>
                                                    </div>
                                                </Group>
                                            </Paper>
                                        </SimpleGrid>
                                    </Card>
                                </Grid.Col>

                                {/* Recent Transactions */}
                                <Grid.Col span={12}>
                                    <Card withBorder radius="md">
                                        <Group justify="space-between" mb="md">
                                            <Title order={4}>Recent Transactions</Title>
                                            <Button
                                                variant="subtle"
                                                size="sm"
                                                component={Link}
                                                href={`/customer/accounts/${account.id}/transactions`}
                                                rightSection={<IconHistory size={16} />}
                                            >
                                                View All
                                            </Button>
                                        </Group>

                                        <ScrollArea h={300}>
                                            <Stack gap="xs">
                                                {recentTransactions.slice(0, 10).map((transaction) => (
                                                    <TransactionRow key={transaction.id} transaction={transaction} accountId={account.id} />
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
                                </Grid.Col>
                            </Grid>
                        </Tabs.Panel>

                        {/* Transactions Tab */}
                        <Tabs.Panel value="transactions" pt="md">
                            <Card withBorder radius="md">
                                <Group justify="space-between" mb="md">
                                    <Title order={4}>Transaction History</Title>
                                    <Group>
                                        <Button
                                            variant="light"
                                            leftSection={<IconDownload size={16} />}
                                        >
                                            Export
                                        </Button>
                                        <Button
                                            variant="light"
                                            leftSection={<IconPrinter size={16} />}
                                        >
                                            Print
                                        </Button>
                                    </Group>
                                </Group>

                                <ScrollArea h={500}>
                                    <Table verticalSpacing="sm">
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>Date</Table.Th>
                                                <Table.Th>Description</Table.Th>
                                                <Table.Th>Type</Table.Th>
                                                <Table.Th>Amount</Table.Th>
                                                <Table.Th>Status</Table.Th>
                                                <Table.Th>Balance</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {accountTransactions.map((at) => (
                                                <Table.Tr key={at.id}>
                                                    <Table.Td>{formatDate(at.createdAt)}</Table.Td>
                                                    <Table.Td>
                                                        <Text size="sm">{at.transaction.description || at.transaction.transactionType.type}</Text>
                                                        <Text size="xs" c="dimmed">{at.transaction.referenceNumber}</Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge variant="light" color={
                                                            at.transaction.amount > 0 ? 'green' : 'red'
                                                        }>
                                                            {at.transaction.transactionType.type}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text fw={500} c={at.transaction.amount > 0 ? 'green' : 'red'}>
                                                            {at.transaction.amount > 0 ? '+' : ''}{formatCurrency(at.transaction.amount)}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Badge
                                                            color={
                                                                at.transaction.transactionStatus.status === 'completed' ? 'green' :
                                                                    at.transaction.transactionStatus.status === 'pending' ? 'yellow' : 'red'
                                                            }
                                                            variant="light"
                                                        >
                                                            {at.transaction.transactionStatus.status}
                                                        </Badge>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text fw={500}>{formatCurrency(at.balanceAfter)}</Text>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </ScrollArea>
                            </Card>
                        </Tabs.Panel>

                        {/* Details Tab */}
                        <Tabs.Panel value="details" pt="md">
                            <Grid gutter="md">
                                <Grid.Col span={12}>
                                    <Card withBorder radius="md">
                                        <Title order={4} mb="md">Account Information</Title>

                                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                                            <Stack gap="md">
                                                <div>
                                                    <Text fz="sm" c="dimmed" fw={500}>Account Number</Text>
                                                    <Group gap="xs">
                                                        <Text fz="lg" fw={600}>{account.accountNumber}</Text>
                                                        <CopyButton value={account.accountNumber}>
                                                            {({ copied, copy }) => (
                                                                <ActionIcon
                                                                    variant="subtle"
                                                                    size="sm"
                                                                    onClick={copy}
                                                                    color={copied ? 'green' : 'gray'}
                                                                >
                                                                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                                                </ActionIcon>
                                                            )}
                                                        </CopyButton>
                                                    </Group>
                                                </div>

                                                <div>
                                                    <Text fz="sm" c="dimmed" fw={500}>Account Type</Text>
                                                    <Text fz="lg" fw={600}>{account.accountType.type}</Text>
                                                </div>

                                                <div>
                                                    <Text fz="sm" c="dimmed" fw={500}>Status</Text>
                                                    <Badge
                                                        size="lg"
                                                        color={
                                                            account.accountStatus.status === 'active' ? 'green' :
                                                                account.accountStatus.status === 'pending' ? 'yellow' : 'red'
                                                        }
                                                        variant="light"
                                                    >
                                                        {account.accountStatus.status}
                                                    </Badge>
                                                </div>

                                                <div>
                                                    <Text fz="sm" c="dimmed" fw={500}>Date Opened</Text>
                                                    <Text fz="lg" fw={600}>{formatDate(account.createdAt)}</Text>
                                                </div>
                                            </Stack>

                                            <Stack gap="md">
                                                <div>
                                                    <Text fz="sm" c="dimmed" fw={500}>Account Holder</Text>
                                                    <Text fz="lg" fw={600}>{account.customer.firstName} {account.customer.lastName}</Text>
                                                    <Text fz="sm" c="dimmed">{account.customer.email}</Text>
                                                    <Text fz="sm" c="dimmed">{account.customer.phone}</Text>
                                                </div>

                                                <div>
                                                    <Text fz="sm" c="dimmed" fw={500}>Last Updated</Text>
                                                    <Text fz="lg" fw={600}>{formatDate(account.updatedAt)}</Text>
                                                </div>

                                                <div>
                                                    <Text fz="sm" c="dimmed" fw={500}>Transaction Count</Text>
                                                    <Text fz="lg" fw={600}>{statistics.totalTransactions}</Text>
                                                </div>
                                            </Stack>
                                        </SimpleGrid>
                                    </Card>
                                </Grid.Col>

                                {/* Account Features */}
                                <Grid.Col span={12}>
                                    <Card withBorder radius="md">
                                        <Title order={4} mb="md">Account Features</Title>

                                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                                            {accountFeatures.map((feature, index) => (
                                                <Paper key={index} withBorder p="md" radius="md">
                                                    <Group gap="sm">
                                                        <ThemeIcon size={40} radius="md" variant="light">
                                                            {feature.icon}
                                                        </ThemeIcon>
                                                        <div>
                                                            <Text fz="sm" c="dimmed">{feature.label}</Text>
                                                            <Text fz="lg" fw={600}>{feature.value}</Text>
                                                        </div>
                                                    </Group>
                                                </Paper>
                                            ))}
                                        </SimpleGrid>
                                    </Card>
                                </Grid.Col>

                                {/* Account Management */}
                                <Grid.Col span={12}>
                                    <Card withBorder radius="md">
                                        <Title order={4} mb="md">Account Management</Title>

                                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                            <Button
                                                variant="light"
                                                color="blue"
                                                leftSection={<IconSettings size={16} />}
                                                component={Link}
                                                href={`/customer/accounts/${account.id}/settings`}
                                                fullWidth
                                            >
                                                Account Settings
                                            </Button>

                                            <Button
                                                variant="light"
                                                color="orange"
                                                leftSection={<IconBell size={16} />}
                                                component={Link}
                                                href={`/customer/accounts/${account.id}/alerts`}
                                                fullWidth
                                            >
                                                Set Up Alerts
                                            </Button>

                                            <Button
                                                variant="light"
                                                color="violet"
                                                leftSection={<IconLock size={16} />}
                                                component={Link}
                                                href={`/customer/accounts/${account.id}/security`}
                                                fullWidth
                                            >
                                                Security Settings
                                            </Button>

                                            <Button
                                                variant="light"
                                                color="red"
                                                leftSection={<IconX size={16} />}
                                                onClick={openCloseAccountModal}
                                                disabled={!isActive || account.balance !== 0}
                                                fullWidth
                                            >
                                                Close Account
                                            </Button>
                                        </SimpleGrid>

                                        {account.balance !== 0 && (
                                            <Alert color="red" icon={<IconInfoCircle size={16} />} mt="md">
                                                Account balance must be $0.00 before closing
                                            </Alert>
                                        )}
                                    </Card>
                                </Grid.Col>
                            </Grid>
                        </Tabs.Panel>
                    </Tabs>
                </Grid.Col>

                {/* Right Column */}
                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Stack gap="md">
                        {/* Balance History */}
                        <Card withBorder radius="md">
                            <Title order={4} mb="md">Balance History</Title>

                            <Stack gap="md">
                                {accountTransactions.slice(0, 5).map((at) => (
                                    <Group key={at.id} justify="space-between">
                                        <div>
                                            <Text size="sm">{formatDate(at.createdAt)}</Text>
                                            <Text size="xs" c="dimmed">
                                                {at.transaction.transactionType.type}
                                            </Text>
                                        </div>
                                        <Text fw={600}>{formatCurrency(at.balanceAfter)}</Text>
                                    </Group>
                                ))}

                                {accountTransactions.length === 0 && (
                                    <Center h={100}>
                                        <Text c="dimmed">No balance history available</Text>
                                    </Center>
                                )}
                            </Stack>
                        </Card>

                        {/* Account Alerts */}
                        <Card withBorder radius="md">
                            <Group justify="space-between" mb="md">
                                <Title order={4}>Alerts</Title>
                                <Badge color="red" variant="light">3 New</Badge>
                            </Group>

                            <Stack gap="md">
                                <Alert color="blue" icon={<IconInfoCircle size={16} />} title="Low Balance">
                                    <Text size="sm">Your balance is below the minimum threshold</Text>
                                </Alert>
                                <Alert color="green" icon={<IconCheck size={16} />} title="Direct Deposit">
                                    <Text size="sm">Your salary deposit has been processed</Text>
                                </Alert>
                                <Alert color="orange" icon={<IconCalendar size={16} />} title="Payment Due">
                                    <Text size="sm">Loan payment due in 3 days</Text>
                                </Alert>

                                <Button
                                    variant="light"
                                    fullWidth
                                    leftSection={<IconBell size={16} />}
                                    component={Link}
                                    href={`/customer/accounts/${account.id}/alerts`}
                                >
                                    Manage Alerts
                                </Button>
                            </Stack>
                        </Card>

                        {/* Quick Links */}
                        <Card withBorder radius="md">
                            <Title order={4} mb="md">Quick Links</Title>

                            <Stack gap="xs">
                                <Button
                                    variant="subtle"
                                    justify="flex-start"
                                    component={Link}
                                    href="/customer/statements"
                                    leftSection={<IconPrinter size={16} />}
                                >
                                    Statements & Documents
                                </Button>
                                <Button
                                    variant="subtle"
                                    justify="flex-start"
                                    component={Link}
                                    href="/customer/tax"
                                    leftSection={<IconReceipt size={16} />}
                                >
                                    Tax Documents
                                </Button>
                                <Button
                                    variant="subtle"
                                    justify="flex-start"
                                    component={Link}
                                    href="/customer/help"
                                    leftSection={<IconInfoCircle size={16} />}
                                >
                                    Understanding Transactions
                                </Button>
                                <Button
                                    variant="subtle"
                                    justify="flex-start"
                                    component={Link}
                                    href="/customer/contact"
                                    leftSection={<IconShare size={16} />}
                                >
                                    Contact Customer Service
                                </Button>
                            </Stack>
                        </Card>
                    </Stack>
                </Grid.Col>
            </Grid>

            {/* Modals */}
            <TransferModal
                opened={transferModalOpened}
                onClose={closeTransferModal}
                accounts={[{ id: account.id, accountNumber: account.accountNumber, balance: account.balance, type: account.accountType.type }]}
                onSuccess={() => router.refresh()}
            />

            <DepositModal
                opened={depositModalOpened}
                onClose={closeDepositModal}
                accounts={[{ id: account.id, accountNumber: account.accountNumber, balance: account.balance, type: account.accountType.type }]}
                onSuccess={() => router.refresh()}
            />

            <WithdrawalModal
                opened={withdrawalModalOpened}
                onClose={closeWithdrawalModal}
                accounts={[{ id: account.id, accountNumber: account.accountNumber, balance: account.balance, type: account.accountType.type }]}
                onSuccess={() => router.refresh()}
            />

            <PaymentModal
                opened={paymentModalOpened}
                onClose={closePaymentModal}
                accounts={[{ id: account.id, accountNumber: account.accountNumber, balance: account.balance, type: account.accountType.type }]}
                onSuccess={() => router.refresh()}
            />

            {/* Close Account Modal */}
            <Modal
                opened={closeAccountModalOpened}
                onClose={closeCloseAccountModal}
                title="Close Account"
                centered
            >
                <Stack gap="md">
                    <Alert color="red" icon={<IconX size={16} />}>
                        <Text size="sm">
                            <strong>Warning:</strong> Closing your account is permanent and cannot be undone.
                            All account features will be disabled immediately.
                        </Text>
                    </Alert>

                    <div>
                        <Text fw={600} mb="xs">Account Details</Text>
                        <Group justify="space-between">
                            <Text size="sm" c="dimmed">Account Number:</Text>
                            <Text size="sm" fw={500}>{account.accountNumber}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="sm" c="dimmed">Current Balance:</Text>
                            <Text size="sm" fw={500}>{formatCurrency(account.balance)}</Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="sm" c="dimmed">Account Type:</Text>
                            <Text size="sm" fw={500}>{account.accountType.type}</Text>
                        </Group>
                    </div>

                    {account.balance !== 0 ? (
                        <Alert color="orange" icon={<IconInfoCircle size={16} />}>
                            <Text size="sm">
                                You must transfer or withdraw your remaining balance of {formatCurrency(account.balance)}
                                before closing this account.
                            </Text>
                        </Alert>
                    ) : (
                        <Text size="sm" c="dimmed">
                            Are you sure you want to close this account? This action cannot be reversed.
                        </Text>
                    )}

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeCloseAccountModal}>
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            onClick={handleCloseAccount}
                            disabled={account.balance !== 0}
                        >
                            Close Account
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
}

// Transaction Row Component
function TransactionRow({ transaction, accountId }: { transaction: any, accountId: number }) {
    const isIncoming = transaction.amount > 0;
    const isTransfer = transaction.transactionType.type === 'transfer';
    const isFromThisAccount = transaction.fromAccountId === accountId;
    const isToThisAccount = transaction.toAccountId === accountId;

    const getDescription = () => {
        if (isTransfer) {
            if (isFromThisAccount) {
                return `Transfer to ${transaction.toAccount?.accountNumber || 'Unknown'}`;
            } else if (isToThisAccount) {
                return `Transfer from ${transaction.fromAccount?.accountNumber || 'Unknown'}`;
            }
        }
        return transaction.description || transaction.transactionType.type;
    };

    const getPartyName = () => {
        if (isTransfer) {
            if (isFromThisAccount && transaction.toAccount?.customer) {
                return `${transaction.toAccount.customer.firstName} ${transaction.toAccount.customer.lastName}`;
            } else if (isToThisAccount && transaction.fromAccount?.customer) {
                return `${transaction.fromAccount.customer.firstName} ${transaction.fromAccount.customer.lastName}`;
            }
        }
        return transaction.user ? `${transaction.user.firstName} ${transaction.user.lastName}` : '';
    };

    return (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
                <Group gap="sm">
                    <Avatar size="sm" color={isIncoming ? 'green' : 'red'}>
                        {isTransfer ? <IconTransfer size={16} /> :
                            isIncoming ? <IconTrendingUp size={16} /> : <IconTrendingDown size={16} />}
                    </Avatar>
                    <div>
                        <Text fw={500} size="sm">{getDescription()}</Text>
                        <Text size="xs" c="dimmed">
                            {formatDateTime(transaction.createdAt)} • {getPartyName()}
                        </Text>
                    </div>
                </Group>

                <div style={{ textAlign: 'right' }}>
                    <Text fw={600} c={isIncoming ? 'green' : 'red'}>
                        {isIncoming ? '+' : ''}{formatCurrency(transaction.amount)}
                    </Text>
                    <Badge
                        size="xs"
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