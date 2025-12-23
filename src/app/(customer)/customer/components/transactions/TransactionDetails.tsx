// components/transactions/TransactionDetails.tsx
'use client';

import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
    Alert,
    Badge,
    Button,
    Card,
    Container,
    CopyButton,
    Divider,
    Grid,
    GridCol,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Table,
    Text,
    ThemeIcon,
    Title,
    Tooltip
} from '@mantine/core';
import {
    IconAlertCircle,
    IconArrowLeft,
    IconBuildingBank,
    IconCash,
    IconCheck,
    IconClock,
    IconCopy,
    IconHistory,
    IconInfoCircle,
    IconReceipt,
    IconReceipt2,
    IconTransfer,
    IconUser,
    IconX
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TransactionDetailsProps {
    transaction: any;
    relatedTransactions: any[];
}

export default function TransactionDetails({
    transaction,
    relatedTransactions,
}: TransactionDetailsProps) {
    const router = useRouter();

    const isTransfer = transaction.transactionType.type === 'transfer';
    const isDeposit = transaction.transactionType.type === 'deposit';
    const isWithdrawal = transaction.transactionType.type === 'withdrawal';
    const isPayment = transaction.transactionType.type === 'payment';
    const isIncoming = transaction.amount > 0;

    const getTransactionIcon = () => {
        if (isTransfer) return <IconTransfer size={24} />;
        if (isDeposit) return <IconCash size={24} />;
        if (isWithdrawal) return <IconCash size={24} />;
        if (isPayment) return <IconReceipt2 size={24} />;
        return <IconReceipt size={24} />;
    };

    const getStatusColor = () => {
        switch (transaction.transactionStatus.status) {
            case 'completed': return 'green';
            case 'pending': return 'yellow';
            case 'failed': return 'red';
            case 'cancelled': return 'gray';
            default: return 'blue';
        }
    };

    const getStatusIcon = () => {
        switch (transaction.transactionStatus.status) {
            case 'completed': return <IconCheck size={16} />;
            case 'pending': return <IconClock size={16} />;
            case 'failed': return <IconX size={16} />;
            default: return <IconInfoCircle size={16} />;
        }
    };

    // // Navigation items
    // const breadcrumbItems = [
    //     { title: 'Dashboard', href: '/customer/dashboard' },
    //     { title: 'Accounts', href: '/customer/accounts' },
    //     { title: transaction.account.accountNumber, href: `/customer/accounts/${transaction.account.id}` },
    //     { title: 'Transactions', href: `/customer/accounts/${transaction.account.id}/transactions` },
    //     { title: `#${transaction.referenceNumber}`, href: '#' },
    // ];

    return (
        <Container size="md" py="xl" fluid>
            {/* Header */}
            <Stack gap="md" mb="xl">
                <Group>
                    <Button
                        variant="subtle"
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={() => router.back()}
                    >
                        Back
                    </Button>
                </Group>

                <Group justify="space-between" align="flex-start">
                    <div>
                        <Title order={2}>Transaction Details</Title>
                        <Text c="dimmed">
                            {formatDateTime(transaction.createdAt)}
                        </Text>
                    </div>

                    <Badge
                        size="lg"
                        color={getStatusColor()}
                        variant="light"
                        leftSection={getStatusIcon()}
                    >
                        {transaction.transactionStatus.status.toUpperCase()}
                    </Badge>
                </Group>
            </Stack>

            {/* Main Content */}
            <Grid gutter="xl">
                <GridCol span={{ base: 12, lg: 8 }}>
                    <Stack gap="md">
                        {/* Transaction Summary Card */}
                        <Card withBorder radius="md">
                            <Group justify="space-between" align="flex-start" mb="md">
                                <Group gap="sm">
                                    <ThemeIcon size={40} radius="md" variant="light">
                                        {getTransactionIcon()}
                                    </ThemeIcon>
                                    <div>
                                        <Text fw={600} size="lg">
                                            {transaction.transactionType.type.toUpperCase()}
                                        </Text>
                                        <Text c="dimmed" size="sm">
                                            Reference: {transaction.referenceNumber}
                                        </Text>
                                    </div>
                                </Group>

                                <Text fz="xl" fw={700} c={isIncoming ? 'green' : 'red'}>
                                    {isIncoming ? '+' : ''}{formatCurrency(transaction.amount)}
                                </Text>
                            </Group>

                            {transaction.description && (
                                <Alert color="blue" icon={<IconInfoCircle size={16} />} mb="md">
                                    {transaction.description}
                                </Alert>
                            )}

                            <Divider my="md" />

                            {/* Transaction Details */}
                            <SimpleGrid cols={2} spacing="md">
                                <div>
                                    <Text fz="sm" c="dimmed" fw={500}>Date & Time</Text>
                                    <Text fz="md">{formatDateTime(transaction.createdAt)}</Text>
                                </div>

                                <div>
                                    <Text fz="sm" c="dimmed" fw={500}>Transaction Type</Text>
                                    <Badge variant="light">{transaction.transactionType.type}</Badge>
                                </div>

                                <div>
                                    <Text fz="sm" c="dimmed" fw={500}>Primary Account</Text>
                                    <Group gap="xs">
                                        <Text fz="md">{transaction.account.accountNumber}</Text>
                                        <CopyButton value={transaction.account.accountNumber}>
                                            {({ copied, copy }) => (
                                                <Tooltip label="Copy account number">
                                                    <Button
                                                        variant="subtle"
                                                        size="xs"
                                                        p={0}
                                                        color={copied ? 'green' : 'gray'}
                                                        onClick={copy}
                                                    >
                                                        {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                                    </Button>
                                                </Tooltip>
                                            )}
                                        </CopyButton>
                                    </Group>
                                    <Text fz="sm" c="dimmed">
                                        {transaction.account.customer.firstName} {transaction.account.customer.lastName}
                                    </Text>
                                </div>

                                <div>
                                    <Text fz="sm" c="dimmed" fw={500}>Status</Text>
                                    <Badge color={getStatusColor()} variant="light">
                                        {transaction.transactionStatus.status}
                                    </Badge>
                                </div>
                            </SimpleGrid>
                        </Card>

                        {/* Related Accounts */}
                        {(isTransfer || transaction.fromAccount || transaction.toAccount) && (
                            <Card withBorder radius="md">
                                <Title order={4} mb="md">Accounts Involved</Title>

                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                    {/* Source Account */}
                                    {transaction.fromAccount && (
                                        <Paper withBorder p="md" radius="md">
                                            <Group gap="sm" mb="xs">
                                                <ThemeIcon size={30} radius="md" variant="light" color="red">
                                                    <IconBuildingBank size={18} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text fw={600}>From Account</Text>
                                                    <Text size="sm" c="dimmed">
                                                        {transaction.fromAccount.accountNumber}
                                                    </Text>
                                                </div>
                                            </Group>
                                            <Text size="sm">
                                                {transaction.fromAccount.customer.firstName} {transaction.fromAccount.customer.lastName}
                                            </Text>
                                            <Text size="sm" c="dimmed">
                                                {transaction.fromAccount.customer.email}
                                            </Text>
                                        </Paper>
                                    )}

                                    {/* Destination Account */}
                                    {transaction.toAccount && (
                                        <Paper withBorder p="md" radius="md">
                                            <Group gap="sm" mb="xs">
                                                <ThemeIcon size={30} radius="md" variant="light" color="green">
                                                    <IconBuildingBank size={18} />
                                                </ThemeIcon>
                                                <div>
                                                    <Text fw={600}>To Account</Text>
                                                    <Text size="sm" c="dimmed">
                                                        {transaction.toAccount.accountNumber}
                                                    </Text>
                                                </div>
                                            </Group>
                                            <Text size="sm">
                                                {transaction.toAccount.customer.firstName} {transaction.toAccount.customer.lastName}
                                            </Text>
                                            <Text size="sm" c="dimmed">
                                                {transaction.toAccount.customer.email}
                                            </Text>
                                        </Paper>
                                    )}
                                </SimpleGrid>
                            </Card>
                        )}

                        {/* Balance History */}
                        {transaction.accountTransactions.length > 0 && (
                            <Card withBorder radius="md">
                                <Title order={4} mb="md">Balance Impact</Title>

                                <Table>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Account</Table.Th>
                                            <Table.Th>Balance Before</Table.Th>
                                            <Table.Th>Balance After</Table.Th>
                                            <Table.Th>Change</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {transaction.accountTransactions.map((at: any) => (
                                            <Table.Tr key={at.id}>
                                                <Table.Td>
                                                    <Text fw={500}>{at.account.accountNumber}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text>{formatCurrency(at.balanceBefore)}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text fw={600}>{formatCurrency(at.balanceAfter)}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text c={at.balanceAfter - at.balanceBefore >= 0 ? 'green' : 'red'}>
                                                        {at.balanceAfter - at.balanceBefore >= 0 ? '+' : ''}
                                                        {formatCurrency(at.balanceAfter - at.balanceBefore)}
                                                    </Text>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Card>
                        )}

                        {/* Related Transactions (for transfers) */}
                        {relatedTransactions.length > 0 && (
                            <Card withBorder radius="md">
                                <Title order={4} mb="md">Related Transactions</Title>

                                <Stack gap="md">
                                    {relatedTransactions.map((relatedTx) => (
                                        <Paper key={relatedTx.id} withBorder p="md" radius="md">
                                            <Group justify="space-between">
                                                <div>
                                                    <Text fw={500}>
                                                        {relatedTx.transactionType.type} - {relatedTx.account.accountNumber}
                                                    </Text>
                                                    <Text size="sm" c="dimmed">
                                                        {formatDate(relatedTx.createdAt)} • {relatedTx.referenceNumber}
                                                    </Text>
                                                </div>
                                                <div>
                                                    <Text fw={600} c={relatedTx.amount > 0 ? 'green' : 'red'}>
                                                        {relatedTx.amount > 0 ? '+' : ''}{formatCurrency(relatedTx.amount)}
                                                    </Text>
                                                    <Badge
                                                        size="sm"
                                                        color={
                                                            relatedTx.transactionStatus.status === 'completed' ? 'green' :
                                                                relatedTx.transactionStatus.status === 'pending' ? 'yellow' : 'red'
                                                        }
                                                        variant="light"
                                                    >
                                                        {relatedTx.transactionStatus.status}
                                                    </Badge>
                                                </div>
                                            </Group>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Card>
                        )}
                    </Stack>
                </GridCol>

                {/* Sidebar */}
                <GridCol span={{ base: 12, lg: 4 }}>
                    <Stack gap="md">
                        {/* Actions Card */}
                        <Card withBorder radius="md">
                            <Title order={4} mb="md">Actions</Title>

                            <Stack gap="xs">
                                <CopyButton value={transaction.referenceNumber}>
                                    {({ copied, copy }) => (
                                        <Button
                                            variant="light"
                                            fullWidth
                                            leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                            onClick={copy}
                                            color={copied ? 'green' : 'blue'}
                                        >
                                            {copied ? 'Reference Copied' : 'Copy Reference'}
                                        </Button>
                                    )}
                                </CopyButton>

                                <Button
                                    variant="light"
                                    fullWidth
                                    leftSection={<IconReceipt size={16} />}
                                    component={Link}
                                    href={`/customer/transactions/${transaction.id}/receipt`}
                                >
                                    View Receipt
                                </Button>

                                {transaction.transactionStatus.status === 'pending' && (
                                    <Button
                                        variant="light"
                                        color="red"
                                        fullWidth
                                        leftSection={<IconX size={16} />}
                                        onClick={() => {
                                            // Implement cancel functionality
                                        }}
                                    >
                                        Cancel Transaction
                                    </Button>
                                )}

                                {transaction.transactionStatus.status === 'failed' && (
                                    <Button
                                        variant="light"
                                        color="orange"
                                        fullWidth
                                        leftSection={<IconAlertCircle size={16} />}
                                        component={Link}
                                        href="/customer/support"
                                    >
                                        Report Issue
                                    </Button>
                                )}
                            </Stack>
                        </Card>

                        {/* User Info Card */}
                        <Card withBorder radius="md">
                            <Title order={4} mb="md">Initiated By</Title>

                            <Group gap="sm">
                                <ThemeIcon size={40} radius="md" variant="light">
                                    <IconUser size={20} />
                                </ThemeIcon>
                                <div>
                                    <Text fw={500}>
                                        {transaction.user.firstName} {transaction.user.lastName}
                                    </Text>
                                    <Text size="sm" c="dimmed">{transaction.user.email}</Text>
                                    <Badge size="sm" variant="light">
                                        {transaction.user.role}
                                    </Badge>
                                </div>
                            </Group>
                        </Card>

                        {/* Transaction Metadata */}
                        <Card withBorder radius="md">
                            <Title order={4} mb="md">Transaction Info</Title>

                            <Stack gap="sm">
                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Transaction ID:</Text>
                                    <Text size="sm" fw={500}>#{transaction.id}</Text>
                                </Group>

                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Created:</Text>
                                    <Text size="sm" fw={500}>{formatDate(transaction.createdAt)}</Text>
                                </Group>

                                <Group justify="space-between">
                                    <Text size="sm" c="dimmed">Last Updated:</Text>
                                    <Text size="sm" fw={500}>{formatDate(transaction.updatedAt)}</Text>
                                </Group>

                                {transaction.approvals.length > 0 && (
                                    <>
                                        <Divider my="xs" />
                                        <Text fw={600} size="sm">Approvals</Text>
                                        {transaction.approvals.map((approval: any) => (
                                            <Group key={approval.id} justify="space-between">
                                                <Text size="sm" c="dimmed">{approval.approver.role}:</Text>
                                                <Badge
                                                    size="sm"
                                                    color={approval.status.status === 'approved' ? 'green' : 'yellow'}
                                                    variant="light"
                                                >
                                                    {approval.status.status}
                                                </Badge>
                                            </Group>
                                        ))}
                                    </>
                                )}
                            </Stack>
                        </Card>

                        {/* Navigation Card */}
                        <Card withBorder radius="md">
                            <Title order={4} mb="md">Navigation</Title>

                            <Stack gap="xs">
                                <Button
                                    variant="subtle"
                                    justify="flex-start"
                                    leftSection={<IconArrowLeft size={16} />}
                                    onClick={() => router.back()}
                                >
                                    Go Back
                                </Button>

                                <Button
                                    variant="subtle"
                                    justify="flex-start"
                                    leftSection={<IconHistory size={16} />}
                                    component={Link}
                                    href={`/customer/accounts/${transaction.account.id}/transactions`}
                                >
                                    Account Transactions
                                </Button>

                                <Button
                                    variant="subtle"
                                    justify="flex-start"
                                    leftSection={<IconBuildingBank size={16} />}
                                    component={Link}
                                    href={`/customer/accounts/${transaction.account.id}`}
                                >
                                    Account Details
                                </Button>

                                <Button
                                    variant="subtle"
                                    justify="flex-start"
                                    leftSection={<IconInfoCircle size={16} />}
                                    component={Link}
                                    href="/customer/help/transactions"
                                >
                                    Understanding Transactions
                                </Button>
                            </Stack>
                        </Card>
                    </Stack>
                </GridCol>
            </Grid>
        </Container>
    );
}