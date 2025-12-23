'use client';

import { resetCustomerPassword, toggleCustomerStatus } from '@/lib/actions/admin/customer';
import { Customer, PaginationInfo } from '@/types/employee';
import {
    ActionIcon,
    Badge,
    Box,
    Flex,
    Group,
    LoadingOverlay,
    Menu,
    Modal,
    Pagination,
    Paper,
    Select,
    Table,
    Text,
    TextInput,
    Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconBan,
    IconCheck,
    IconDotsVertical,
    IconEdit,
    IconEye,
    IconFilter,
    IconHistory,
    IconKey,
    IconSearch,
    IconWallet
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CustomerModal from './CustomerModal';




interface CustomerTableProps {
  initialData: {
    customers: Customer[];
    pagination: PaginationInfo;
  };
  searchParams: {
    search: string;
    status: string;
    page: number;
  };
}

export default function CustomerTable({ initialData, searchParams }: CustomerTableProps) {
  const router = useRouter();
  
  const [customers, setCustomers] = useState<Customer[]>(initialData.customers);
  const [pagination, setPagination] = useState<PaginationInfo>(initialData.pagination);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Filter states
  const [search, setSearch] = useState(searchParams.search);
  const [status, setStatus] = useState<string>(searchParams.status);
  const [page, setPage] = useState(searchParams.page);

  // Update customers when initialData changes
  useEffect(() => {
    setCustomers(initialData.customers);
    setPagination(initialData.pagination);
  }, [initialData]);

  // Update URL with filters
  const updateFilters = () => {
    const newParams = new URLSearchParams();
    if (search) newParams.set('search', search);
    if (status !== 'ALL') newParams.set('status', status);
    if (page > 1) newParams.set('page', page.toString());
    
    router.push(`/admin/customers?${newParams.toString()}`);
  };

  // Handle filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
    }, 500);
    updateFilters();

    return () => clearTimeout(timeoutId);
  }, [search, status, page]);

  // Handle customer actions
  const handleToggleStatus = async (id: number) => {
    const customer = customers.find(c => c.id === id);
    const action = customer?.status === 'ACTIVE' ? 'suspend' : 'activate';
    
    if (!confirm(`Are you sure you want to ${action} this customer?`)) return;

    setLoading(true);
    const result = await toggleCustomerStatus(id);

    if (result.success) {
      notifications.show({
        title: 'Success',
        message: result.message,
        color: 'green',
      });
      // Refresh data
      router.refresh();
    } else {
      notifications.show({
        title: 'Error',
        message: result.message,
        color: 'red',
      });
    }
    setLoading(false);
  };

  const handleResetPassword = async (id: number) => {
    if (!confirm('Reset customer password? A temporary password will be generated.')) return;

    setLoading(true);
    const result = await resetCustomerPassword(id);

    if (result.success) {
      notifications.show({
        title: 'Password Reset',
        message: `Temporary password: ${result.data?.tempPassword}`,
        color: 'green',
      });
    } else {
      notifications.show({
        title: 'Error',
        message: result.message,
        color: 'red',
      });
    }
    setLoading(false);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    openModal();
  };

  const handleModalClose = () => {
    closeModal();
    setEditingCustomer(null);
  };

  const handleModalSuccess = () => {
    router.refresh();
    handleModalClose();
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate total balance (mock - would need to fetch actual balances)
  const calculateMockBalance = (customer: Customer) => {
    // In a real app, you would fetch actual balances
    const base = customer._count.accounts * 1000;
    return (base * (customer.status === 'ACTIVE' ? 1 : 0.5)).toFixed(2);
  };

  return (
    <>
      <Box pos="relative">
        <LoadingOverlay visible={loading} />

        {/* Filters */}
        <Paper p="md" mb="md" withBorder>
          <Group>
            <TextInput
              placeholder="Search by name, email, or phone"
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Status"
              data={[
                { value: 'ALL', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'BANNED', label: 'Suspended' },
              ]}
              value={status}
              onChange={(value) => setStatus(value || 'ALL')}
              leftSection={<IconFilter size={16} />}
            />
          </Group>
        </Paper>

        {/* Table */}
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Contact</Table.Th>
                <Table.Th>Accounts</Table.Th>
                <Table.Th>Activity</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Joined</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {customers.map((customer) => (
                <Table.Tr key={customer.id}>
                  <Table.Td>
                    <div>
                      <Text fw={500}>
                        {customer.firstName} {customer.lastName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        ID: {customer.id}
                      </Text>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div>
                      <Text size="sm">{customer.email}</Text>
                      {customer.phone && (
                        <Text size="xs" c="dimmed">
                          {customer.phone}
                        </Text>
                      )}
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Badge size="xs" variant="outline" title="Total Accounts">
                        <IconWallet size={12} style={{ marginRight: 4 }} />
                        {customer._count.accounts}
                      </Badge>
                      <Badge size="xs" variant="outline" title="Balance">
                        ${calculateMockBalance(customer)}
                      </Badge>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Badge size="xs" variant="outline" title="Transactions">
                        T: {customer._count.transactions}
                      </Badge>
                      <Badge size="xs" variant="outline" title="Notifications">
                        N: {customer._count.notifications}
                      </Badge>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={customer.status === 'ACTIVE' ? 'green' : 'red'}
                      variant="light"
                    >
                      {customer.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(customer.createdAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="View Details">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => router.push(`/admin/customers/${customer.id}`)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit Customer">
                        <ActionIcon
                          variant="subtle"
                          color="orange"
                          onClick={() => handleEdit(customer)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={customer.status === 'ACTIVE' ? 'Suspend' : 'Activate'}>
                        <ActionIcon
                          variant="subtle"
                          color={customer.status === 'ACTIVE' ? 'red' : 'green'}
                          onClick={() => handleToggleStatus(customer.id)}
                        >
                          {customer.status === 'ACTIVE' ? (
                            <IconBan size={16} />
                          ) : (
                            <IconCheck size={16} />
                          )}
                        </ActionIcon>
                      </Tooltip>
                      <Menu position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconWallet size={14} />}
                            onClick={() => router.push(`/admin/customers/${customer.id}#accounts`)}
                          >
                            View Accounts
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconHistory size={14} />}
                            onClick={() => router.push(`/admin/customers/${customer.id}#transactions`)}
                          >
                            View Transactions
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconKey size={14} />}
                            onClick={() => handleResetPassword(customer.id)}
                          >
                            Reset Password
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {/* No results */}
        {customers.length === 0 && (
          <Paper p="xl" mt="md" withBorder>
            <Text ta="center" c="dimmed">
              No customers found. Try adjusting your filters.
            </Text>
          </Paper>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Flex justify="center" mt="xl">
            <Pagination
              value={page}
              onChange={setPage}
              total={pagination.totalPages}
              siblings={1}
              boundaries={1}
            />
          </Flex>
        )}

        {/* Pagination Info */}
        {customers.length > 0 && (
          <Text size="sm" c="dimmed" ta="center" mt="md">
            Showing {((page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} customers
          </Text>
        )}
      </Box>

      {/* Customer Modal */}
      <Modal
        opened={modalOpened}
        onClose={handleModalClose}
        title="Edit Customer"
        size="md"
        centered
      >
        <CustomerModal
          customer={editingCustomer}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      </Modal>
    </>
  );
}