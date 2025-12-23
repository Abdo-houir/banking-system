import { getCustomers, getCustomerStats } from '@/lib/actions/admin/customer';
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
import { IconTrendingUp, IconUserCheck, IconUsers, IconUserX, IconWallet } from '@tabler/icons-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CustomerTable from './CustomerTable';

interface PageProps {
  searchParams?: {
    search?: string;
    status?: string;
    page?: string;
  };
}

export default async function CustomersPage({ searchParams }: PageProps) {
  // Check if user is admin
  try {
    await requireRole(['ADMIN']);
  } catch {
    redirect('/auth/login');
  }

  // Parse search params
  const search = searchParams?.search || '';
  const status = searchParams?.status as 'ACTIVE' | 'BANNED' | 'ALL' || 'ALL';
  const page = parseInt(searchParams?.page || '1');

  // Fetch customers and stats in parallel
  const [customersResult, statsResult] = await Promise.all([
    getCustomers({
      search,
      status,
      page,
      pageSize: 5,
    }),
    getCustomerStats(),
  ]);

  // Default empty data structure
  const defaultData = {
    customers: [],
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
          Customers
        </Text>
      </Breadcrumbs>

      {/* Page Header */}
      <Group justify="space-between" mb="xl">
        <div>
          <Group gap="sm">
            <IconUsers size={32} />
            <div>
              <Title order={1}>Customer Management</Title>
              <Text c="dimmed">
                Manage customer accounts and monitor activity
              </Text>
            </div>
          </Group>
        </div>
      </Group>

      {/* Statistics Cards */}
      {stats && (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} mb="xl">
          <Card withBorder radius="md">
            <Group>
              <IconUsers size={24} color="blue" />
              <div>
                <Text size="sm" c="dimmed">Total Customers</Text>
                <Title order={3}>{stats.totalCustomers}</Title>
              </div>
            </Group>
            <Badge color="blue" variant="light" mt="sm">
              +{stats.newCustomersToday} today
            </Badge>
          </Card>

          <Card withBorder radius="md">
            <Group>
              <IconUserCheck size={24} color="green" />
              <div>
                <Text size="sm" c="dimmed">Active</Text>
                <Title order={3}>{stats.activeCustomers}</Title>
              </div>
            </Group>
            <Badge color="green" variant="light" mt="sm">
              {Math.round((stats.activeCustomers / stats.totalCustomers) * 100)}%
            </Badge>
          </Card>

          <Card withBorder radius="md">
            <Group>
              <IconUserX size={24} color="red" />
              <div>
                <Text size="sm" c="dimmed">Suspended</Text>
                <Title order={3}>{stats.bannedCustomers}</Title>
              </div>
            </Group>
            <Badge color="red" variant="light" mt="sm">
              Watchlist
            </Badge>
          </Card>

          <Card withBorder radius="md">
            <Group>
              <IconWallet size={24} color="orange" />
              <div>
                <Text size="sm" c="dimmed">Total Accounts</Text>
                <Title order={3}>{stats.totalAccounts}</Title>
              </div>
            </Group>
            <Text size="xs" c="dimmed" mt="sm">
              ~{stats.avgAccountsPerCustomer.toFixed(1)} per customer
            </Text>
          </Card>

          <Card withBorder radius="md">
            <Group>
              <IconTrendingUp size={24} color="green" />
              <div>
                <Text size="sm" c="dimmed">Total Balance</Text>
                <Title order={3}>${stats.totalBalance.toLocaleString()}</Title>
              </div>
            </Group>
            <Text size="xs" c="dimmed" mt="sm">
              Bank assets
            </Text>
          </Card>
        </SimpleGrid>
      )}

      {/* Main Content */}
      <Paper shadow="sm" p="md" radius="md" withBorder>
        <Stack gap="md">
          <CustomerTable
            initialData={customersResult.success && customersResult.data ? customersResult.data : defaultData}
            searchParams={{ search, status, page }}
          />
        </Stack>
      </Paper>
    </Container>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;