// components/accounts/AccountTransactions.tsx
'use client';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Card,
  Center,
  Container,
  CopyButton,
  Divider,
  Grid,
  Group,
  Menu,
  Pagination,
  Paper,
  Progress,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip
} from '@mantine/core'; // Note: Changed import source
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconArrowsSort,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconCurrencyDollar,
  IconDatabaseExport,
  IconEye,
  IconFileSpreadsheet,
  IconFileTypeCsv,
  IconFileTypePdf,
  IconFilter,
  IconHistory,
  IconInfoCircle,
  IconReceipt2,
  IconRefresh,
  IconSearch,
  IconTransfer,
  IconTrash,
  IconTrendingDown,
  IconTrendingUp
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/en'; // Import dayjs locale
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Set dayjs locale
dayjs.locale('en');

interface AccountTransactionsProps {
  account: any;
  transactions: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sort?: string;
  };
  summary: {
    count: number;
    totalAmount: number;
    averageAmount: number;
    minAmount: number;
    maxAmount: number;
    monthlySummary: any[];
  };
  transactionTypes: any[];
  transactionStatuses: any[];
}
type DatesRangeValue = [Date | null, Date | null];

export default function AccountTransactions({
  account,
  transactions,
  pagination,
  filters,
  summary,
  transactionTypes,
  transactionStatuses,
}: AccountTransactionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [exportModalOpened, { open: openExportModal, close: closeExportModal }] = useDisclosure(false);
  
  // Filter states - Fix DatePicker type
  const [typeFilter, setTypeFilter] = useState<string | null>(filters.type || null);
  const [statusFilter, setStatusFilter] = useState<string | null>(filters.status || null);
  const [dateRange, setDateRange] = useState<DatesRangeValue>([
    filters.startDate ? new Date(filters.startDate) : null,
    filters.endDate ? new Date(filters.endDate) : null,
  ]);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [sortBy, setSortBy] = useState(filters.sort || 'createdAt:desc');
  
  const isLoanAccount = account.accountType.type === 'loan';
  
  // Build URL with filters
  const buildUrl = (newFilters: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    
    // Always reset to page 1 when filters change
    params.set('page', '1');
    
    return `/customer/accounts/${account.id}/transactions?${params.toString()}`;
  };
  
  // Apply filters
  const applyFilters = () => {
    const newFilters: any = {};
    
    if (typeFilter) newFilters.type = typeFilter;
    if (statusFilter) newFilters.status = statusFilter;
    if (dateRange[0]) newFilters.startDate = dayjs(dateRange[0]).format('YYYY-MM-DD');
    if (dateRange[1]) newFilters.endDate = dayjs(dateRange[1]).format('YYYY-MM-DD');
    if (searchTerm) newFilters.search = searchTerm;
    if (sortBy) newFilters.sort = sortBy;
    
    router.push(buildUrl(newFilters));
  };
  
  // Clear all filters
  const clearFilters = () => {
    setTypeFilter(null);
    setStatusFilter(null);
    setDateRange([null, null]);
    setSearchTerm('');
    setSortBy('createdAt:desc');
    router.push(buildUrl({}));
  };
  
  // Handle transaction selection
  const toggleTransactionSelection = (id: number) => {
    setSelectedTransactions(prev =>
      prev.includes(id) ? prev.filter(txId => txId !== id) : [...prev, id]
    );
  };
  
  // Select all transactions on current page
  const selectAllTransactions = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(tx => tx.id));
    }
  };
  
  // Handle export
  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    // Implement export logic here
    notifications.show({
      title: 'Export Started',
      message: `Exporting ${selectedTransactions.length || transactions.length} transactions as ${format.toUpperCase()}`,
      color: 'blue',
    });
    closeExportModal();
  };
  
  // Get transaction summary stats
  const getTransactionStats = () => {
    const incoming = transactions.filter(tx => tx.amount > 0);
    const outgoing = transactions.filter(tx => tx.amount < 0);
    
    return {
      incomingCount: incoming.length,
      outgoingCount: outgoing.length,
      incomingTotal: incoming.reduce((sum, tx) => sum + tx.amount, 0),
      outgoingTotal: Math.abs(outgoing.reduce((sum, tx) => sum + tx.amount, 0)),
    };
  };
  
  const transactionStats = getTransactionStats();
  
  // Breadcrumb items
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/customer/dashboard' },
    { title: 'Accounts', href: '/customer/accounts' },
    { title: account.accountNumber, href: `/customer/accounts/${account.id}` },
    { title: 'Transactions', href: '#' },
  ];

  // Add useEffect to update filters when URL changes
  useEffect(() => {
    if (searchParams) {
      const type = searchParams.get('type');
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const sort = searchParams.get('sort');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      
      setTypeFilter(type);
      setStatusFilter(status);
      setSearchTerm(search || '');
      setSortBy(sort || 'createdAt:desc');
      setDateRange([
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null,
      ]);
    }
  }, [searchParams]);
  
  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Stack gap="md" mb="xl">
        <Breadcrumbs separator={<IconChevronRight size={16} />}>
          {breadcrumbItems.map((item, index) => (
            <Anchor
              key={index}
              href={item.href}
              c={index === breadcrumbItems.length - 1 ? 'dimmed' : 'blue'}
              underline="hover"
            >
              {item.title}
            </Anchor>
          ))}
        </Breadcrumbs>
        
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>Transaction History</Title>
            <Text c="dimmed">
              {account.accountNumber} • {account.accountType.type} Account
            </Text>
          </div>
          
          <Group>
            <Button
              variant="light"
              leftSection={<IconArrowLeft size={16} />}
              component={Link}
              href={`/customer/accounts/${account.id}`}
            >
              Back to Account
            </Button>
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={() => router.refresh()}
              loading={loading}
            >
              Refresh
            </Button>
          </Group>
        </Group>
      </Stack>
      
      {/* Summary Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="xl">
        <Card withBorder radius="md">
          <Group>
            <ThemeIcon size={40} radius="md" variant="light" color="blue">
              <IconHistory size={24} />
            </ThemeIcon>
            <div>
              <Text fz="xs" c="dimmed">Total Transactions</Text>
              <Text fz="lg" fw={700}>{summary.count.toLocaleString()}</Text>
            </div>
          </Group>
        </Card>
        
        <Card withBorder radius="md">
          <Group>
            <ThemeIcon size={40} radius="md" variant="light" color="green">
              <IconTrendingUp size={24} />
            </ThemeIcon>
            <div>
              <Text fz="xs" c="dimmed">Total Incoming</Text>
              <Text fz="lg" fw={700}>{formatCurrency(transactionStats.incomingTotal)}</Text>
              <Text fz="xs" c="dimmed">{transactionStats.incomingCount} transactions</Text>
            </div>
          </Group>
        </Card>
        
        <Card withBorder radius="md">
          <Group>
            <ThemeIcon size={40} radius="md" variant="light" color="red">
              <IconTrendingDown size={24} />
            </ThemeIcon>
            <div>
              <Text fz="xs" c="dimmed">Total Outgoing</Text>
              <Text fz="lg" fw={700}>{formatCurrency(transactionStats.outgoingTotal)}</Text>
              <Text fz="xs" c="dimmed">{transactionStats.outgoingCount} transactions</Text>
            </div>
          </Group>
        </Card>
        
        <Card withBorder radius="md">
          <Group>
            <ThemeIcon size={40} radius="md" variant="light" color="violet">
              <IconCurrencyDollar size={24} />
            </ThemeIcon>
            <div>
              <Text fz="xs" c="dimmed">Net Flow</Text>
              <Text fz="lg" fw={700} c={
                transactionStats.incomingTotal - transactionStats.outgoingTotal >= 0 ? 'green' : 'red'
              }>
                {formatCurrency(transactionStats.incomingTotal - transactionStats.outgoingTotal)}
              </Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>
      
      <Grid gutter="xl">
        {/* Main Content */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card withBorder radius="md" p={0}>
            {/* Header with Actions */}
            <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
              <Group justify="space-between">
                <Group>
                  <Text fw={600}>Transaction History</Text>
                  <Badge variant="light" color="blue">
                    {pagination.total.toLocaleString()} total
                  </Badge>
                </Group>
                
                <Group>
                  <SegmentedControl
                    value={viewMode}
                    onChange={(value) =>setViewMode(value as "table" | "cards")}
                    data={[
                      { label: 'Table', value: 'table' },
                      { label: 'Cards', value: 'cards' },
                    ]}
                    styles={{
                        innerLabel: {
                            textWrap: "nowrap"
                        }
                    }}
                    size="sm"
                  />
                  
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <Button
                        variant="light"
                        leftSection={<IconDatabaseExport size={16} />}
                        rightSection={<IconChevronDown size={16} />}
                      >
                        Export
                      </Button>
                    </Menu.Target>
                    
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconFileTypeCsv size={16} />}
                        onClick={() => handleExport('csv')}
                      >
                        Export as CSV
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconFileTypePdf size={16} />}
                        onClick={() => handleExport('pdf')}
                      >
                        Export as PDF
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconFileSpreadsheet size={16} />}
                        onClick={() => handleExport('excel')}
                      >
                        Export as Excel
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                  
                  <Button
                    variant="light"
                    leftSection={<IconFilter size={16} />}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    Filters {showFilters ? '↑' : '↓'}
                  </Button>
                </Group>
              </Group>
            </Box>
            
            {/* Filters Panel */}
            {showFilters && (
              <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
                <Stack gap="md">
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Search"
                        placeholder="Search by description or reference..."
                        leftSection={<IconSearch size={16} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Select
                        label="Sort By"
                        value={sortBy}
                        onChange={(value) => setSortBy(value as string)}
                        data={[
                          { value: 'createdAt:desc', label: 'Newest First' },
                          { value: 'createdAt:asc', label: 'Oldest First' },
                          { value: 'amount:desc', label: 'Highest Amount' },
                          { value: 'amount:asc', label: 'Lowest Amount' },
                        ]}
                        leftSection={<IconArrowsSort size={16} />}
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Select
                        label="Transaction Type"
                        placeholder="All types"
                        clearable
                        value={typeFilter}
                        onChange={setTypeFilter}
                        data={transactionTypes.map(t => ({
                          value: t.type,
                          label: t.type.charAt(0).toUpperCase() + t.type.slice(1),
                        }))}
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Select
                        label="Status"
                        placeholder="All statuses"
                        clearable
                        value={statusFilter}
                        onChange={setStatusFilter}
                        data={transactionStatuses.map(s => ({
                          value: s.status,
                          label: s.status.charAt(0).toUpperCase() + s.status.slice(1),
                        }))}
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      {/* <DatePickerInput
                        type="range"
                        label="Date Range"
                        placeholder="Pick date range"
                        value={dateRange}
                        onChange={setDateRange}
                        clearable
                        // Add these props for better UX
                        popoverProps={{ withinPortal: true }}
                        valueFormat="MMM DD, YYYY"
                      /> */}
                    </Grid.Col>
                  </Grid>
                  
                  <Group justify="space-between">
                    <Button
                      variant="subtle"
                      color="red"
                      leftSection={<IconTrash size={16} />}
                      onClick={clearFilters}
                    >
                      Clear All Filters
                    </Button>
                    
                    <Group>
                      <Button variant="default" onClick={() => setShowFilters(false)}>
                        Cancel
                      </Button>
                      <Button onClick={applyFilters}>
                        Apply Filters
                      </Button>
                    </Group>
                  </Group>
                </Stack>
              </Box>
            )}
            
            {/* Transactions List */}
            <Box p="md">
              {viewMode === 'table' ? (
                <>
                  <Table verticalSpacing="sm" striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ width: 50 }}>
                          <Tooltip label="Select all">
                            <input
                              type="checkbox"
                              checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                              onChange={selectAllTransactions}
                              style={{ cursor: 'pointer' }}
                            />
                          </Tooltip>
                        </Table.Th>
                        <Table.Th>Date & Time</Table.Th>
                        <Table.Th>Description</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Amount</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {transactions.map((transaction) => (
                        <Table.Tr key={transaction.id}>
                          <Table.Td>
                            <input
                              type="checkbox"
                              checked={selectedTransactions.includes(transaction.id)}
                              onChange={() => toggleTransactionSelection(transaction.id)}
                              style={{ cursor: 'pointer' }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <div>
                              <Text size="sm">{formatDate(transaction.createdAt)}</Text>
                              <Text size="xs" c="dimmed">
                                {dayjs(transaction.createdAt).format('HH:mm')}
                              </Text>
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <div>
                              <Text size="sm" fw={500}>
                                {transaction.description || transaction.transactionType.type}
                              </Text>
                              <Text size="xs" c="dimmed">
                                Ref: {transaction.referenceNumber}
                              </Text>
                              {transaction.fromAccount && transaction.toAccount && (
                                <Text size="xs" c="dimmed">
                                  {transaction.fromAccount.accountNumber === account.accountNumber 
                                    ? `To: ${transaction.toAccount.accountNumber}`
                                    : `From: ${transaction.fromAccount.accountNumber}`}
                                </Text>
                              )}
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant="light"
                              color={
                                transaction.transactionType.type === 'deposit' ? 'green' :
                                transaction.transactionType.type === 'withdrawal' ? 'red' :
                                transaction.transactionType.type === 'transfer' ? 'blue' :
                                transaction.transactionType.type === 'payment' ? 'orange' : 'gray'
                              }
                            >
                              {transaction.transactionType.type}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              fw={600}
                              c={transaction.amount > 0 ? 'green' : 'red'}
                            >
                              {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                            </Text>
                            {transaction.accountTransactions?.[0] && (
                              <Text size="xs" c="dimmed">
                                Balance: {formatCurrency(transaction.accountTransactions[0].balanceAfter)}
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={
                                transaction.transactionStatus.status === 'completed' ? 'green' :
                                transaction.transactionStatus.status === 'pending' ? 'yellow' :
                                transaction.transactionStatus.status === 'failed' ? 'red' : 'gray'
                              }
                              variant="light"
                            >
                              {transaction.transactionStatus.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              <Tooltip label="View Details">
                                <ActionIcon
                                  variant="subtle"
                                  color="blue"
                                  component={Link}
                                  href={`/customer/transactions/${transaction.id}`}
                                >
                                  <IconEye size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <CopyButton value={transaction.referenceNumber}>
                                {({ copied, copy }) => (
                                  <Tooltip label="Copy Reference">
                                    <ActionIcon
                                      variant="subtle"
                                      color={copied ? 'green' : 'gray'}
                                      onClick={copy}
                                    >
                                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </CopyButton>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                  
                  {transactions.length === 0 && (
                    <Center py={50}>
                      <Stack align="center" gap="sm">
                        <IconHistory size={48} color="gray" />
                        <Text fw={500}>No transactions found</Text>
                        <Text c="dimmed" size="sm">
                          {searchTerm || typeFilter || statusFilter || dateRange[0] || dateRange[1]
                            ? 'Try adjusting your filters'
                            : 'No transactions have been made on this account yet'}
                        </Text>
                        {(searchTerm || typeFilter || statusFilter || dateRange[0] || dateRange[1]) && (
                          <Button variant="light" onClick={clearFilters}>
                            Clear Filters
                          </Button>
                        )}
                      </Stack>
                    </Center>
                  )}
                </>
              ) : (
                // Cards View
                <Stack gap="md">
                  {transactions.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      account={account}
                    />
                  ))}
                  
                  {transactions.length === 0 && (
                    <Center py={50}>
                      <Stack align="center" gap="sm">
                        <IconHistory size={48} color="gray" />
                        <Text fw={500}>No transactions found</Text>
                      </Stack>
                    </Center>
                  )}
                </Stack>
              )}
            </Box>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} transactions
                  </Text>
                  
                  <Pagination
                    value={pagination.page}
                    onChange={(page) => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('page', page.toString());
                      router.push(`?${params.toString()}`);
                    }}
                    total={pagination.totalPages}
                    siblings={1}
                    boundaries={1}
                  />
                  
                  <Select
                    size="xs"
                    value={pagination.limit.toString()}
                    onChange={(value) => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('limit', value || '20');
                      router.push(`?${params.toString()}`);
                    }}
                    data={[
                      { value: '10', label: '10 per page' },
                      { value: '20', label: '20 per page' },
                      { value: '50', label: '50 per page' },
                      { value: '100', label: '100 per page' },
                    ]}
                  />
                </Group>
              </Box>
            )}
          </Card>
        </Grid.Col>
        
        {/* Sidebar */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Stack gap="md">
            {/* Account Summary */}
            <Card withBorder radius="md">
              <Title order={4} mb="md">Account Summary</Title>
              
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Account Number:</Text>
                  <Text size="sm" fw={500}>{account.accountNumber}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Account Type:</Text>
                  <Badge color="blue" variant="light">
                    {account.accountType.type}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Status:</Text>
                  <Badge
                    color={account.accountStatus.status === 'active' ? 'green' : 'red'}
                    variant="light"
                  >
                    {account.accountStatus.status}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Current Balance:</Text>
                  <Text size="sm" fw={600}>
                    {isLoanAccount ? `-${formatCurrency(Math.abs(account.balance))}` : formatCurrency(account.balance)}
                  </Text>
                </Group>
                
                <Divider my="sm" />
                
                <Button
                  variant="light"
                  fullWidth
                  component={Link}
                  href={`/customer/accounts/${account.id}`}
                  leftSection={<IconArrowLeft size={16} />}
                >
                  Back to Account
                </Button>
              </Stack>
            </Card>
            
            {/* Monthly Summary */}
            <Card withBorder radius="md">
              <Title order={4} mb="md">Monthly Activity</Title>
              
              <Stack gap="md">
                {summary.monthlySummary.slice(0, 6).map((month: any, index: number) => (
                  <div key={index}>
                    <Group justify="space-between" mb={4}>
                      <Text size="sm" fw={500}>
                        {dayjs(month.month).format('MMM YYYY')}
                      </Text>
                      <Badge variant="light" size="sm">
                        {month.count} txns
                      </Badge>
                    </Group>
                    
                    <Group gap="xs" mb={4}>
                      <Text size="xs" c="green">
                        +{formatCurrency(month.total_incoming || 0)}
                      </Text>
                      <Text size="xs" c="red">
                        -{formatCurrency(month.total_outgoing || 0)}
                      </Text>
                    </Group>
                    
                    <Progress.Root size={6}>
                      <Progress.Section
                        value={(month.total_incoming / (month.total_incoming + month.total_outgoing)) * 100}
                        color="green"
                      />
                      <Progress.Section
                        value={(month.total_outgoing / (month.total_incoming + month.total_outgoing)) * 100}
                        color="red"
                      />
                    </Progress.Root>
                  </div>
                ))}
                
                {summary.monthlySummary.length === 0 && (
                  <Center h={100}>
                    <Text c="dimmed" size="sm">No activity in the last 6 months</Text>
                  </Center>
                )}
              </Stack>
            </Card>
            
            {/* Quick Stats */}
            <Card withBorder radius="md">
              <Title order={4} mb="md">Transaction Stats</Title>
              
              <SimpleGrid cols={2} spacing="md">
                <Stack gap={4} align="center">
                  <ThemeIcon size={50} radius="md" variant="light" color="green">
                    <IconTrendingUp size={24} />
                  </ThemeIcon>
                  <Text size="sm" fw={600}>{formatCurrency(summary.averageAmount)}</Text>
                  <Text size="xs" c="dimmed">Avg Transaction</Text>
                </Stack>
                
                <Stack gap={4} align="center">
                  <ThemeIcon size={50} radius="md" variant="light" color="red">
                    <IconTrendingDown size={24} />
                  </ThemeIcon>
                  <Text size="sm" fw={600}>{formatCurrency(summary.minAmount)}</Text>
                  <Text size="xs" c="dimmed">Smallest</Text>
                </Stack>
                
                <Stack gap={4} align="center">
                  <ThemeIcon size={50} radius="md" variant="light" color="blue">
                    <IconTrendingUp size={24} />
                  </ThemeIcon>
                  <Text size="sm" fw={600}>{formatCurrency(summary.maxAmount)}</Text>
                  <Text size="xs" c="dimmed">Largest</Text>
                </Stack>
                
                <Stack gap={4} align="center">
                  <ThemeIcon size={50} radius="md" variant="light" color="violet">
                    <IconCurrencyDollar size={24} />
                  </ThemeIcon>
                  <Text size="sm" fw={600}>{formatCurrency(summary.totalAmount)}</Text>
                  <Text size="xs" c="dimmed">Total Volume</Text>
                </Stack>
              </SimpleGrid>
            </Card>
            
            {/* Help Card */}
            <Card withBorder radius="md">
              <Title order={4} mb="md">Need Help?</Title>
              
              <Stack gap="xs">
                <Button
                  variant="subtle"
                  justify="flex-start"
                  component={Link}
                  href="/customer/help/transactions"
                  leftSection={<IconInfoCircle size={16} />}
                >
                  Understanding Transactions
                </Button>
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

// Transaction Card Component - FIXED
function TransactionCard({ transaction, account }: { transaction: any, account: any }) {
  const isIncoming = transaction.amount > 0;
  const isTransfer = transaction.transactionType.type === 'transfer';
  const isFromThisAccount = transaction.fromAccountId === account.id;
  const isToThisAccount = transaction.toAccountId === account.id;
  
  const getIcon = () => {
    if (isTransfer) return <IconTransfer size={20} />;
    if (transaction.transactionType.type === 'deposit') return <IconTrendingUp size={20} />;
    if (transaction.transactionType.type === 'withdrawal') return <IconTrendingDown size={20} />;
    if (transaction.transactionType.type === 'payment') return <IconReceipt2 size={20} />;
    return <IconHistory size={20} />;
  };
  
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
  
  // FIXED: Corrected the ternary operator syntax
  const getBadgeColor = () => {
    switch (transaction.transactionType.type) {
      case 'deposit': return 'green';
      case 'withdrawal': return 'red';
      case 'transfer': return 'blue';
      case 'payment': return 'orange';
      default: return 'gray';
    }
  };
  
  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between">
        <Group gap="sm">
          <Avatar size="md" color={isIncoming ? 'green' : 'red'}>
            {getIcon()}
          </Avatar>
          <div>
            <Text fw={500} size="sm">{getDescription()}</Text>
            <Text size="xs" c="dimmed">
              {formatDateTime(transaction.createdAt)}
              {getPartyName() && ` • ${getPartyName()}`}
            </Text>
            <Group gap={4} mt={2}>
              <Badge
                size="xs"
                variant="light"
                color={getBadgeColor()}
              >
                {transaction.transactionType.type}
              </Badge>
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
            </Group>
          </div>
        </Group>
        
        <Stack gap={2} align="flex-end">
          <Text fw={600} c={isIncoming ? 'green' : 'red'}>
            {isIncoming ? '+' : ''}{formatCurrency(transaction.amount)}
          </Text>
          {transaction.accountTransactions?.[0] && (
            <Text size="xs" c="dimmed">
              Balance: {formatCurrency(transaction.accountTransactions[0].balanceAfter)}
            </Text>
          )}
          <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
            {transaction.referenceNumber}
          </Text>
        </Stack>
      </Group>
      
      <Group justify="flex-end" mt="md" gap={4}>
        <CopyButton value={transaction.referenceNumber}>
          {({ copied, copy }) => (
            <Button
              variant="subtle"
              size="xs"
              leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              onClick={copy}
              color={copied ? 'green' : 'gray'}
            >
              {copied ? 'Copied' : 'Copy Ref'}
            </Button>
          )}
        </CopyButton>
        <Button
          variant="subtle"
          size="xs"
          leftSection={<IconEye size={14} />}
          component={Link}
          href={`/customer/transactions/${transaction.id}`}
        >
          Details
        </Button>
      </Group>
    </Paper>
  );
}