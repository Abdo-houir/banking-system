'use client';

import { changeAccountStatus } from '@/lib/actions/admin/account';
import { Account, PaginationInfo } from '@/types/employee';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Flex,
  Group,
  LoadingOverlay,
  Menu,
  Modal,
  NumberInput,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconBan,
  IconCheck,
  IconDotsVertical,
  IconDownload,
  IconEdit,
  IconEye,
  IconFilter,
  IconReceipt,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AccountModal from './AccountModal';
// import AccountStatementModal from './AccountStatementModal';




interface AccountTableProps {
  initialData: {
    accounts: Account[];
    pagination: PaginationInfo;
  };
  searchParams: {
    search: string;
    accountType: string;
    accountStatus: string;
    page: number;
  };
}

export default function AccountTable({ initialData, searchParams }: AccountTableProps) {
  const router = useRouter();
  
  const [accounts, setAccounts] = useState<Account[]>(initialData.accounts);
  const [pagination, setPagination] = useState<PaginationInfo>(initialData.pagination);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [statementModalOpened, { open: openStatementModal, close: closeStatementModal }] = useDisclosure(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  // Filter states
  const [search, setSearch] = useState(searchParams.search);
  const [accountType, setAccountType] = useState<string>(searchParams.accountType);
  const [accountStatus, setAccountStatus] = useState<string>(searchParams.accountStatus);
  const [page, setPage] = useState(searchParams.page);
  const [minBalance, setMinBalance] = useState<number | ''>('');
  const [maxBalance, setMaxBalance] = useState<number | ''>('');

  // Update accounts when initialData changes
  useEffect(() => {
    setAccounts(initialData.accounts);
    setPagination(initialData.pagination);
  }, [initialData]);

  // Update URL with filters
  const updateFilters = () => {
    const newParams = new URLSearchParams();
    if (search) newParams.set('search', search);
    if (accountType) newParams.set('accountType', accountType);
    if (accountStatus) newParams.set('accountStatus', accountStatus);
    if (minBalance !== '') newParams.set('minBalance', minBalance.toString());
    if (maxBalance !== '') newParams.set('maxBalance', maxBalance.toString());
    if (page > 1) newParams.set('page', page.toString());
    
    router.push(`/admin/accounts?${newParams.toString()}`);
  };

  // Handle filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
    }, 500);
    updateFilters();

    return () => clearTimeout(timeoutId);
  }, [search, accountType, accountStatus, minBalance, maxBalance, page]);

  const handleStatusChange = async (accountId: number, newStatus: string) => {
    const statusMap: Record<string, number> = {
      'active': 1,
      'frozen': 2,
      'suspended': 3,
      'closed': 4,
    };

    const statusId = statusMap[newStatus];
    if (!statusId) return;

    setLoading(true);
    const result = await changeAccountStatus(accountId, statusId);

    if (result.success) {
      notifications.show({
        title: 'Success',
        message: result.message,
        color: 'green',
      });
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

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    openEditModal();
  };

  const handleViewStatement = (account: Account) => {
    setSelectedAccount(account);
    openStatementModal();
  };

  const handleViewDetails = (accountId: number) => {
    router.push(`/admin/accounts/${accountId}`);
  };

  const handleModalClose = () => {
    closeEditModal();
    setEditingAccount(null);
  };

  const handleStatementModalClose = () => {
    closeStatementModal();
    setSelectedAccount(null);
  };

  const handleModalSuccess = () => {
    router.refresh();
    handleModalClose();
  };

  const clearFilters = () => {
    setSearch('');
    setAccountType('');
    setAccountStatus('');
    setMinBalance('');
    setMaxBalance('');
    setPage(1);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'frozen': return 'yellow';
      case 'suspended': return 'orange';
      case 'closed': return 'red';
      default: return 'gray';
    }
  };

  // Get account type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'savings': return 'green';
      case 'checking': return 'blue';
      case 'loan': return 'red';
      case 'credit': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <>
      <Box pos="relative">
        <LoadingOverlay visible={loading} />

        {/* Filters */}
        <Paper p="md" mb="md" withBorder>
          <Stack gap="md">
            <Group>
              <TextInput
                placeholder="Search by account number or customer"
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 2 }}
              />
              <Select
                placeholder="Account Type"
                data={[
                  { value: '', label: 'All Types' },
                  { value: 'savings', label: 'Savings' },
                  { value: 'checking', label: 'Checking' },
                  { value: 'loan', label: 'Loan' },
                  { value: 'credit', label: 'Credit' },
                ]}
                value={accountType}
                onChange={(value) => setAccountType(value || '')}
                leftSection={<IconFilter size={16} />}
              />
              <Select
                placeholder="Account Status"
                data={[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'frozen', label: 'Frozen' },
                  { value: 'suspended', label: 'Suspended' },
                  { value: 'closed', label: 'Closed' },
                ]}
                value={accountStatus}
                onChange={(value) => setAccountStatus(value || '')}
                leftSection={<IconFilter size={16} />}
              />
            </Group>
            
            <Group>
              <NumberInput
                placeholder="Min Balance"
                value={minBalance}
                onChange={(value) => setMinBalance(value as number)}
                prefix="$"
                thousandSeparator=","
                decimalScale={2}
                style={{ width: 150 }}
              />
              <NumberInput
                placeholder="Max Balance"
                value={maxBalance}
                onChange={(value) => setMaxBalance(value as number)}
                prefix="$"
                thousandSeparator=","
                decimalScale={2}
                style={{ width: 150 }}
              />
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </Group>
          </Stack>
        </Paper>

        {/* Table */}
        <Table.ScrollContainer minWidth={1000}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Account Number</Table.Th>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Balance</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Transactions</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {accounts.map((account) => (
                <Table.Tr key={account.id}>
                  <Table.Td>
                    <div>
                      <Text fw={500}>{account.accountNumber}</Text>
                      <Text size="xs" c="dimmed">
                        ID: {account.id}
                      </Text>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <div>
                      <Text size="sm" fw={500}>
                        {account.customer.firstName} {account.customer.lastName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {account.customer.email}
                      </Text>
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={getTypeColor(account.accountType.type)}
                      variant="light"
                    >
                      {account.accountType.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text
                      fw={700}
                      c={account.balance >= 0 ? 'green' : 'red'}
                    >
                      ${Math.abs(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                    {account.loanAmount && (
                      <Text size="xs" c="dimmed">
                        Loan: ${account.loanAmount.toLocaleString()}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={getStatusColor(account.accountStatus.status)}
                      variant="light"
                    >
                      {account.accountStatus.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(account.createdAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="outline">
                      {account._count.transactions}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="View Details">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => handleViewDetails(account.id)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit Account">
                        <ActionIcon
                          variant="subtle"
                          color="orange"
                          onClick={() => handleEdit(account)}
                        >
                          <IconEdit size={16} />
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
                            leftSection={<IconReceipt size={14} />}
                            onClick={() => handleViewStatement(account)}
                          >
                            View Statement
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconDownload size={14} />}
                            onClick={() => {/* Export functionality */}}
                          >
                            Export Transactions
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Label>Change Status</Menu.Label>
                          <Menu.Item
                            leftSection={<IconCheck size={14} />}
                            onClick={() => handleStatusChange(account.id, 'active')}
                            disabled={account.accountStatus.status === 'active'}
                          >
                            Activate
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconBan size={14} color="yellow" />}
                            onClick={() => handleStatusChange(account.id, 'frozen')}
                            disabled={account.accountStatus.status === 'frozen'}
                          >
                            Freeze Account
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconBan size={14} color="orange" />}
                            onClick={() => handleStatusChange(account.id, 'suspended')}
                            disabled={account.accountStatus.status === 'suspended'}
                          >
                            Suspend Account
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconBan size={14} color="red" />}
                            onClick={() => handleStatusChange(account.id, 'closed')}
                            disabled={account.accountStatus.status === 'closed'}
                          >
                            Close Account
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
        {accounts.length === 0 && (
          <Paper p="xl" mt="md" withBorder>
            <Text ta="center" c="dimmed">
              No accounts found. Try adjusting your filters.
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
        {accounts.length > 0 && (
          <Text size="sm" c="dimmed" ta="center" mt="md">
            Showing {((page - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} accounts
          </Text>
        )}
      </Box>

      {/* Account Edit Modal */}
      <Modal
        opened={editModalOpened}
        onClose={handleModalClose}
        title="Edit Account"
        size="lg"
        centered
      >
        <AccountModal
          account={editingAccount}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      </Modal>

      {/* Account Statement Modal */}
      <Modal
        opened={statementModalOpened}
        onClose={handleStatementModalClose}
        title="Account Statement"
        size="xl"
        centered
      >
        {/* <AccountStatementModal
          account={selectedAccount}
          onClose={handleStatementModalClose}
        /> */}
      </Modal>
    </>
  );
}