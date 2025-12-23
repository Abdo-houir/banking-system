import { getAccounts, getAccountStats } from '@/lib/actions/admin/account';
import { requireRole } from '@/lib/auth';
import {
    Anchor,
    Badge,
    Breadcrumbs,
    Card,
    Container,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { IconBan, IconCash, IconChartBar, IconCheck, IconTrendingUp, IconWallet } from '@tabler/icons-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AccountTable from './AccountTable';

interface PageProps {
    searchParams?: {
        search?: string;
        accountType?: string;
        accountStatus?: string;
        page?: string;
    };
}

export default async function AccountsPage({ searchParams }: PageProps) {
    // Check if user is admin
    try {
        await requireRole(['ADMIN']);
    } catch {
        redirect('/auth/login');
    }

    // Parse search params
    const search = searchParams?.search || '';
    const accountType = searchParams?.accountType || '';
    const accountStatus = searchParams?.accountStatus || '';
    const page = parseInt(searchParams?.page || '1');

    // Fetch accounts and stats in parallel
    const [accountsResult, statsResult] = await Promise.all([
        getAccounts({
            search,
            accountType,
            accountStatus,
            page,
            pageSize: 5,
        }),
        getAccountStats(),
    ]);

    // Default empty data structure
    const defaultData = {
        accounts: [],
        pagination: {
            total: 0,
            page: 1,
            pageSize: 5,
            totalPages: 0,
        },
    };

    const stats = statsResult.success ? statsResult.data : null;

    return (
        <Container size="xl" py="xl">
            {/* Breadcrumbs */}
            <Breadcrumbs mb="md">
                <Anchor component={Link} href="/admin" size="sm">
                    Admin
                </Anchor>
                <Text size="sm" c="dimmed">
                    Accounts
                </Text>
            </Breadcrumbs>

            {/* Page Header */}
            <Group justify="space-between" mb="xl">
                <div>
                    <Group gap="sm">
                        <IconWallet size={32} />
                        <div>
                            <Title order={1}>Account Management</Title>
                            <Text c="dimmed">
                                Manage all bank accounts and monitor transactions
                            </Text>
                        </div>
                    </Group>
                </div>
            </Group>

            {/* Statistics Cards */}
            {stats && (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 6 }} mb="xl">
                    <Card withBorder radius="md">
                        <Group>
                            <IconWallet size={24} color="blue" />
                            <div>
                                <Text size="sm" c="dimmed">Total Accounts</Text>
                                <Title order={3}>{stats.totalAccounts}</Title>
                            </div>
                        </Group>
                        <Badge color="blue" variant="light" mt="sm">
                            Active: {stats.activeAccounts}
                        </Badge>
                    </Card>

                    <Card withBorder radius="md">
                        <Group>
                            <IconCheck size={24} color="green" />
                            <div>
                                <Text size="sm" c="dimmed">Active</Text>
                                <Title order={3}>{stats.activeAccounts}</Title>
                            </div>
                        </Group>
                        <Text size="xs" c="dimmed" mt="sm">
                            {Math.round((stats.activeAccounts / stats.totalAccounts) * 100)}% of total
                        </Text>
                    </Card>

                    <Card withBorder radius="md">
                        <Group>
                            <IconBan size={24} color="red" />
                            <div>
                                <Text size="sm" c="dimmed">Frozen/Suspended</Text>
                                <Title order={3}>{stats.frozenAccounts + stats.suspendedAccounts}</Title>
                            </div>
                        </Group>
                        <Badge color="red" variant="light" mt="sm">
                            Requires Attention
                        </Badge>
                    </Card>

                    <Card withBorder radius="md">
                        <Group>
                            <IconTrendingUp size={24} color="green" />
                            <div>
                                <Text size="sm" c="dimmed">Total Balance</Text>
                                <Title order={3}>
                                    ${Math.abs(stats.totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Title>
                            </div>
                        </Group>
                        <Text size="xs" c="dimmed" mt="sm">
                            Avg: ${stats.avgBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Text>
                    </Card>

                    <Card withBorder radius="md">
                        <Group>
                            <IconCash size={24} color="orange" />
                            <div>
                                <Text size="sm" c="dimmed">Total Loans</Text>
                                <Title order={3}>${stats.totalLoans.toLocaleString()}</Title>
                            </div>
                        </Group>
                        <Text size="xs" c="dimmed" mt="sm">
                            Active loan portfolio
                        </Text>
                    </Card>

                    <Card withBorder radius="md">
                        <Group>
                            <IconChartBar size={24} color="violet" />
                            <div>
                                <Text size="sm" c="dimmed">Account Types</Text>
                                <Title order={3}>{stats.accountsByType.length}</Title>
                            </div>
                        </Group>
                        <Text size="xs" c="dimmed" mt="sm">
                            Savings, Checking, Loan, Credit
                        </Text>
                    </Card>
                </SimpleGrid>
            )}

            {/* Account Type Distribution */}
            {stats && (
                <Paper withBorder radius="md" p="md" mb="xl">
                    <Title order={3} mb="md">Account Type Distribution</Title>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                        {stats.accountsByType.map((typeStat, index) => (
                            <Card key={index} withBorder>
                                <Group justify="space-between">
                                    <div>
                                        <Text fw={500} tt="capitalize">{typeStat.type}</Text>
                                        <Text size="sm" c="dimmed">{typeStat.count} accounts</Text>
                                    </div>
                                    <Badge color={
                                        typeStat.type === 'savings' ? 'green' :
                                            typeStat.type === 'checking' ? 'blue' :
                                                typeStat.type === 'loan' ? 'red' : 'orange'
                                    }>
                                        ${Math.abs(typeStat.totalBalance).toLocaleString()}
                                    </Badge>
                                </Group>
                            </Card>
                        ))}
                    </SimpleGrid>
                </Paper>
            )}

            {/* Main Content */}
            <Paper shadow="sm" p="md" radius="md" withBorder>
                <Stack gap="md">
                    <AccountTable
                        initialData={accountsResult.success && accountsResult.data ? accountsResult.data : defaultData}
                        searchParams={{ search, accountType, accountStatus, page }}
                    />
                </Stack>
            </Paper>
        </Container>
    );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;