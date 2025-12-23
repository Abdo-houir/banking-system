import { getCustomerById } from '@/lib/actions/admin/customer';
import { requireRole } from '@/lib/auth';
import {
    Anchor,
    Badge,
    Breadcrumbs,
    Button,
    Card,
    Container,
    Grid,
    GridCol,
    Group,
    Paper,
    SimpleGrid,
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
    TabsPanel,
    TabsTab,
    Text,
    Title
} from '@mantine/core';
import {
    IconArrowLeft,
    IconBell,
    IconCalendar,
    IconMail,
    IconPhone,
    IconReceipt,
    IconUser,
    IconWallet
} from '@tabler/icons-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CustomerDetailsPage({ params }: PageProps) {
    const { id } = await params;

    // Check if user is admin
        try {
            await requireRole(['ADMIN']);
        } catch {
            redirect('/auth/login');
        }

    // Get customer details
    const result = await getCustomerById(parseInt(id));

    if (!result.success) {
        redirect('/admin/customers');
    }

    const customer = result.data?.customer;

    // Format date
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (customer) {
        // Calculate total balance
        const totalBalance = customer.accounts.reduce((sum: number, account: any) => sum + account.balance, 0);

        return (
            <Container size="xl" py="xl">
                {/* Breadcrumbs */}
                <Breadcrumbs mb="md">
                    <Anchor component={Link} href="/admin" size="sm">
                        Admin
                    </Anchor>
                    <Anchor component={Link} href="/admin/customers" size="sm">
                        Customers
                    </Anchor>
                    <Text size="sm" c="dimmed">
                        {customer.firstName} {customer.lastName}
                    </Text>
                </Breadcrumbs>

                {/* Back Button */}
                <Button
                    component={Link}
                    href="/admin/customers"
                    variant="light"
                    leftSection={<IconArrowLeft size={16} />}
                    mb="xl"
                >
                    Back to Customers
                </Button>

                {/* Header */}
                <Group justify="space-between" mb="xl">
                    <Group>
                        <IconUser size={32} />
                        <div>
                            <Title order={1}>
                                {customer.firstName} {customer.lastName}
                            </Title>
                            <Text c="dimmed">Customer ID: {customer.id}</Text>
                        </div>
                    </Group>
                    <Group>
                        <Badge
                            size="lg"
                            color={customer.status === 'ACTIVE' ? 'green' : 'red'}
                        >
                            {customer.status}
                        </Badge>
                    </Group>
                </Group>

                {/* Tabs for different sections */}
                <Tabs defaultValue="overview">
                    <TabsList mb="xl">
                        <TabsTab value="overview" leftSection={<IconUser size={14} />}>
                            Overview
                        </TabsTab>
                        <TabsTab value="accounts" leftSection={<IconWallet size={14} />}>
                            Accounts ({customer.accounts.length})
                        </TabsTab>
                        <TabsTab value="transactions" leftSection={<IconReceipt size={14} />}>
                            Recent Transactions
                        </TabsTab>
                        <TabsTab value="notifications" leftSection={<IconBell size={14} />}>
                            Notifications ({customer.notifications.length})
                        </TabsTab>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsPanel value="overview">
                        <Grid>
                            {/* Left Column - Personal Info */}
                            <GridCol span={{ base: 12, lg: 4 }}>
                                <Stack>
                                    {/* Personal Info Card */}
                                    <Card withBorder shadow="sm" radius="md">
                                        <Title order={3} mb="md">Personal Information</Title>
                                        <Stack gap="md">
                                            <InfoItem
                                                icon={<IconMail size={20} />}
                                                label="Email"
                                                value={customer.email}
                                            />
                                            <InfoItem
                                                icon={<IconPhone size={20} />}
                                                label="Phone"
                                                value={customer.phone || 'Not provided'}
                                            />
                                            <InfoItem
                                                icon={<IconCalendar size={20} />}
                                                label="Member Since"
                                                value={formatDate(customer.createdAt)}
                                            />
                                            <InfoItem
                                                icon={<IconCalendar size={20} />}
                                                label="Last Updated"
                                                value={formatDate(customer.updatedAt)}
                                            />
                                        </Stack>
                                    </Card>

                                    {/* Financial Summary Card */}
                                    <Card withBorder shadow="sm" radius="md">
                                        <Title order={3} mb="md">Financial Summary</Title>
                                        <Stack gap="md">
                                            <div>
                                                <Text size="sm" c="dimmed">Total Balance</Text>
                                                <Title order={2} c="green">
                                                    ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </Title>
                                            </div>
                                            <div>
                                                <Text size="sm" c="dimmed">Total Accounts</Text>
                                                <Title order={3}>{customer.accounts.length}</Title>
                                            </div>
                                            <div>
                                                <Text size="sm" c="dimmed">Total Transactions</Text>
                                                <Title order={3}>{customer.transactions.length}</Title>
                                            </div>
                                        </Stack>
                                    </Card>
                                </Stack>
                            </GridCol>

                            {/* Right Column - Account Summary & Activity */}
                            <GridCol span={{ base: 12, lg: 8 }}>
                                <Stack>
                                    {/* Account Types Breakdown */}
                                    <Card withBorder shadow="sm" radius="md">
                                        <Title order={3} mb="md">Account Distribution</Title>
                                        {customer.accounts.length > 0 ? (
                                            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                                {customer.accounts.map((account: any) => (
                                                    <Paper key={account.id} p="md" withBorder>
                                                        <Group justify="space-between">
                                                            <div>
                                                                <Text fw={500}>{account.accountType.type}</Text>
                                                                <Text size="sm" c="dimmed">{account.accountNumber}</Text>
                                                            </div>
                                                            <div>
                                                                <Text fw={700} size="lg">
                                                                    ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                </Text>
                                                                <Badge
                                                                    size="xs"
                                                                    color={
                                                                        account.accountStatus.status === 'active' ? 'green' :
                                                                            account.accountStatus.status === 'frozen' ? 'yellow' :
                                                                                account.accountStatus.status === 'suspended' ? 'orange' : 'red'
                                                                    }
                                                                >
                                                                    {account.accountStatus.status}
                                                                </Badge>
                                                            </div>
                                                        </Group>
                                                    </Paper>
                                                ))}
                                            </SimpleGrid>
                                        ) : (
                                            <Paper p="xl" withBorder>
                                                <Text ta="center" c="dimmed">
                                                    No accounts found for this customer.
                                                </Text>
                                            </Paper>
                                        )}
                                    </Card>

                                    {/* Recent Activity */}
                                    <Card withBorder shadow="sm" radius="md">
                                        <Title order={3} mb="md">Recent Activity</Title>
                                        {customer.transactions.length > 0 ? (
                                            <Table>
                                                <TableThead>
                                                    <TableTr>
                                                        <TableTh>Date</TableTh>
                                                        <TableTh>Type</TableTh>
                                                        <TableTh>Amount</TableTh>
                                                        <TableTh>Reference</TableTh>
                                                        <TableTh>Status</TableTh>
                                                    </TableTr>
                                                </TableThead>
                                                <TableTbody>
                                                    {customer.transactions.map((transaction: any) => (
                                                        <TableTr key={transaction.id}>
                                                            <TableTd>
                                                                <Text size="sm">
                                                                    {formatDate(transaction.createdAt)}
                                                                </Text>
                                                            </TableTd>
                                                            <TableTd>
                                                                <Badge
                                                                    color={
                                                                        transaction.transactionType.type === 'deposit' ? 'green' :
                                                                            transaction.transactionType.type === 'withdrawal' ? 'red' : 'blue'
                                                                    }
                                                                    variant="light"
                                                                >
                                                                    {transaction.transactionType.type}
                                                                </Badge>
                                                            </TableTd>
                                                            <TableTd>
                                                                <Text
                                                                    fw={600}
                                                                    c={transaction.transactionType.type === 'deposit' ? 'green' : 'red'}
                                                                >
                                                                    ${transaction.amount.toFixed(2)}
                                                                </Text>
                                                            </TableTd>
                                                            <TableTd>
                                                                <Text size="sm" c="dimmed">
                                                                    {transaction.referenceNumber}
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
                                                        </TableTr>
                                                    ))}
                                                </TableTbody>
                                            </Table>
                                        ) : (
                                            <Paper p="xl" withBorder>
                                                <Text ta="center" c="dimmed">
                                                    No recent transactions.
                                                </Text>
                                            </Paper>
                                        )}
                                    </Card>
                                </Stack>
                            </GridCol>
                        </Grid>
                    </TabsPanel>

                    {/* Accounts Tab */}
                    <TabsPanel value="accounts">
                        <Card withBorder shadow="sm" radius="md">
                            <Title order={3} mb="md">Customer Accounts</Title>
                            {customer.accounts.length > 0 ? (
                                <TableScrollContainer minWidth={600}>
                                    <Table>
                                        <TableThead>
                                            <TableTr>
                                                <TableTh>Account Number</TableTh>
                                                <TableTh>Type</TableTh>
                                                <TableTh>Balance</TableTh>
                                                <TableTh>Status</TableTh>
                                                <TableTh>Created</TableTh>
                                                <TableTh>Transactions</TableTh>
                                            </TableTr>
                                        </TableThead>
                                        <TableTbody>
                                            {customer.accounts.map((account: any) => (
                                                <TableTr key={account.id}>
                                                    <TableTd>
                                                        <Text fw={500}>{account.accountNumber}</Text>
                                                    </TableTd>
                                                    <TableTd>
                                                        <Badge variant="light">
                                                            {account.accountType.type}
                                                        </Badge>
                                                    </TableTd>
                                                    <TableTd>
                                                        <Text fw={700}>
                                                            ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </Text>
                                                    </TableTd>
                                                    <TableTd>
                                                        <Badge
                                                            color={
                                                                account.accountStatus.status === 'active' ? 'green' :
                                                                    account.accountStatus.status === 'frozen' ? 'yellow' :
                                                                        account.accountStatus.status === 'suspended' ? 'orange' : 'red'
                                                            }
                                                        >
                                                            {account.accountStatus.status}
                                                        </Badge>
                                                    </TableTd>
                                                    <TableTd>
                                                        <Text size="sm">
                                                            {formatDate(account.createdAt)}
                                                        </Text>
                                                    </TableTd>
                                                    <TableTd>
                                                        <Badge variant="outline">
                                                            {account._count.transactions}
                                                        </Badge>
                                                    </TableTd>
                                                </TableTr>
                                            ))}
                                        </TableTbody>
                                    </Table>
                                </TableScrollContainer>
                            ) : (
                                <Paper p="xl" withBorder>
                                    <Text ta="center" c="dimmed">
                                        No accounts found for this customer.
                                    </Text>
                                </Paper>
                            )}
                        </Card>
                    </TabsPanel>

                    {/* Transactions Tab */}
                    <TabsPanel value="transactions">
                        <Card withBorder shadow="sm" radius="md">
                            <Title order={3} mb="md">Transaction History</Title>
                            {customer.transactions.length > 0 ? (
                                <TableScrollContainer minWidth={600}>
                                    <Table>
                                        <TableThead>
                                            <TableTr>
                                                <TableTh>Date & Time</TableTh>
                                                <TableTh>Type</TableTh>
                                                <TableTh>Amount</TableTh>
                                                <TableTh>Reference</TableTh>
                                                <TableTh>Status</TableTh>
                                            </TableTr>
                                        </TableThead>
                                        <TableTbody>
                                            {customer.transactions.map((transaction: any) => (
                                                <TableTr key={transaction.id}>
                                                    <TableTd>
                                                        <Text size="sm">
                                                            {formatDate(transaction.createdAt)}
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
                                                            fw={600}
                                                            c={transaction.transactionType.type === 'deposit' ? 'green' : 'red'}
                                                        >
                                                            ${transaction.amount.toFixed(2)}
                                                        </Text>
                                                    </TableTd>
                                                    <TableTd>
                                                        <Text size="sm" c="dimmed">
                                                            {transaction.referenceNumber}
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
                                                </TableTr>
                                            ))}
                                        </TableTbody>
                                    </Table>
                                </TableScrollContainer>
                            ) : (
                                <Paper p="xl" withBorder>
                                    <Text ta="center" c="dimmed">
                                        No transaction history available.
                                    </Text>
                                </Paper>
                            )}
                        </Card>
                    </TabsPanel>

                    {/* Notifications Tab */}
                    <TabsPanel value="notifications">
                        <Card withBorder shadow="sm" radius="md">
                            <Title order={3} mb="md">Notifications</Title>
                            {customer.notifications.length > 0 ? (
                                <Stack gap="md">
                                    {customer.notifications.map((notification: any) => (
                                        <Paper key={notification.id} p="md" withBorder>
                                            <Group justify="space-between">
                                                <div>
                                                    <Text fw={500}>{notification.title}</Text>
                                                    <Text size="sm" c="dimmed">{notification.message}</Text>
                                                    <Text size="xs" c="dimmed" mt={4}>
                                                        {formatDate(notification.createdAt)}
                                                    </Text>
                                                </div>
                                                <div>
                                                    <Badge
                                                        color={
                                                            notification.type === 'TRANSACTION' ? 'blue' :
                                                                notification.type === 'ACCOUNT' ? 'green' : 'orange'
                                                        }
                                                    >
                                                        {notification.type}
                                                    </Badge>
                                                    <Badge
                                                        color={notification.isRead ? 'gray' : 'blue'}
                                                        variant="light"
                                                        ml="xs"
                                                    >
                                                        {notification.isRead ? 'Read' : 'Unread'}
                                                    </Badge>
                                                </div>
                                            </Group>
                                        </Paper>
                                    ))}
                                </Stack>
                            ) : (
                                <Paper p="xl" withBorder>
                                    <Text ta="center" c="dimmed">
                                        No notifications found.
                                    </Text>
                                </Paper>
                            )}
                        </Card>
                    </TabsPanel>
                </Tabs>
            </Container>
        );
    } else {
        return <>sss</>
    }
}

// Helper Components
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Group>
            {icon}
            <div>
                <Text size="sm" c="dimmed">{label}</Text>
                <Text fw={500}>{value}</Text>
            </div>
        </Group>
    );
}