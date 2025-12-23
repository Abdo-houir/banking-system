import { getAccountById } from '@/lib/actions/admin/account';
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
  NumberFormatter,
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
  IconCalendar,
  IconCash,
  IconCheck,
  IconLock,
  IconReceipt,
  IconSettings,
  IconUser,
  IconWallet
} from '@tabler/icons-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailsPage({ params }: PageProps) {
  const { id } = await params;

  // Check if user is admin
  try {
    await requireRole(['ADMIN']);
  } catch {
    redirect('/auth/login');
  }

  // Get account details
  const result = await getAccountById(parseInt(id));

  if (!result.success) {
    redirect('/admin/accounts');
  }

  const account = result.data?.account;

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

  // Calculate transaction statistics


  if (account) {
    const transactionStats = {
      totalDeposits: account.transactions
        .filter(t => t.transactionType.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0),
      totalWithdrawals: account.transactions
        .filter(t => t.transactionType.type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0),
      totalTransfers: account.transactions
        .filter(t => t.transactionType.type === 'transfer')
        .reduce((sum, t) => sum + t.amount, 0),
      avgTransaction: account.transactions.length > 0
        ? account.transactions.reduce((sum, t) => sum + t.amount, 0) / account.transactions.length
        : 0,
    };

    return (
      <Container size="xl" py="xl">
        {/* Breadcrumbs */}
        <Breadcrumbs mb="md">
          <Anchor component={Link} href="/admin" size="sm">
            Admin
          </Anchor>
          <Anchor component={Link} href="/admin/accounts" size="sm">
            Accounts
          </Anchor>
          <Text size="sm" c="dimmed">
            {account.accountNumber}
          </Text>
        </Breadcrumbs>

        {/* Back Button */}
        <Button
          component={Link}
          href="/admin/accounts"
          variant="light"
          leftSection={<IconArrowLeft size={16} />}
          mb="xl"
        >
          Back to Accounts
        </Button>

        {/* Header */}
        <Group justify="space-between" mb="xl">
          <Group>
            <IconWallet size={32} />
            <div>
              <Title order={1}>Account Details</Title>
              <Text c="dimmed">
                {account.accountNumber} • {account.customer.firstName} {account.customer.lastName}
              </Text>
            </div>
          </Group>
          <Group>
            <Badge
              size="lg"
              color={
                account.accountStatus.status === 'active' ? 'green' :
                  account.accountStatus.status === 'frozen' ? 'yellow' :
                    account.accountStatus.status === 'suspended' ? 'orange' : 'red'
              }
            >
              {account.accountStatus.status}
            </Badge>
            <Badge
              size="lg"
              color={
                account.accountType.type === 'savings' ? 'green' :
                  account.accountType.type === 'checking' ? 'blue' :
                    account.accountType.type === 'loan' ? 'red' : 'orange'
              }
            >
              {account.accountType.type}
            </Badge>
          </Group>
        </Group>

        {/* Tabs for different sections */}
        <Tabs defaultValue="overview">
          <TabsList mb="xl">
            <TabsTab value="overview" leftSection={<IconWallet size={14} />}>
              Overview
            </TabsTab>
            <TabsTab value="transactions" leftSection={<IconReceipt size={14} />}>
              Transactions ({account.transactions.length})
            </TabsTab>
            <TabsTab value="statement" leftSection={<IconCash size={14} />}>
              Account Statement
            </TabsTab>
            <TabsTab value="settings" leftSection={<IconSettings size={14} />}>
              Settings
            </TabsTab>
          </TabsList>

          {/* Overview Tab */}
          <TabsPanel value="overview">
            <Grid>
              {/* Left Column - Account Info */}
              <GridCol span={{ base: 12, lg: 4 }}>
                <Stack>
                  {/* Account Information Card */}
                  <Card withBorder shadow="sm" radius="md">
                    <Title order={3} mb="md">Account Information</Title>
                    <Stack gap="md">
                      <InfoItem
                        icon={<IconWallet size={20} />}
                        label="Account Number"
                        value={account.accountNumber}
                      />
                      <InfoItem
                        icon={<IconUser size={20} />}
                        label="Account Holder"
                        value={`${account.customer.firstName} ${account.customer.lastName}`}
                      />
                      <InfoItem
                        icon={<IconCalendar size={20} />}
                        label="Opened On"
                        value={formatDate(account.createdAt)}
                      />
                      <InfoItem
                        icon={<IconCalendar size={20} />}
                        label="Last Updated"
                        value={formatDate(account.updatedAt)}
                      />
                    </Stack>
                  </Card>

                  {/* Balance Card */}
                  <Card withBorder shadow="sm" radius="md">
                    <Title order={3} mb="md">Current Balance</Title>
                    <Stack align="center">
                      <Text
                        size="xl"
                        fw={900}
                        c={account.balance >= 0 ? 'green' : 'red'}
                      >
                        <NumberFormatter
                          prefix="$"
                          value={Math.abs(account.balance)}
                          thousandSeparator
                          decimalScale={2}
                        />
                      </Text>
                      {account.balance < 0 && (
                        <Badge color="red" variant="light">
                          Overdrawn
                        </Badge>
                      )}
                      {account.loanAmount && (
                        <Text size="sm" c="dimmed">
                          Original Loan: <NumberFormatter prefix="$" value={account.loanAmount} thousandSeparator />
                        </Text>
                      )}
                    </Stack>
                  </Card>
                </Stack>
              </GridCol>

              {/* Right Column - Financial Details */}
              <GridCol span={{ base: 12, lg: 8 }}>
                <Stack>
                  {/* Limits & Settings Card */}
                  <Card withBorder shadow="sm" radius="md">
                    <Title order={3} mb="md">Account Limits & Settings</Title>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                      {account.transactionLimit && (
                        <div>
                          <Text size="sm" c="dimmed">Transaction Limit</Text>
                          <Text fw={500}>
                            <NumberFormatter prefix="$" value={account.transactionLimit} thousandSeparator />
                          </Text>
                        </div>
                      )}
                      {account.minimumBalance && (
                        <div>
                          <Text size="sm" c="dimmed">Minimum Balance</Text>
                          <Text fw={500}>
                            <NumberFormatter prefix="$" value={account.minimumBalance} thousandSeparator />
                          </Text>
                        </div>
                      )}
                      {account.overdraftLimit && (
                        <div>
                          <Text size="sm" c="dimmed">Overdraft Limit</Text>
                          <Text fw={500}>
                            <NumberFormatter prefix="$" value={account.overdraftLimit} thousandSeparator />
                          </Text>
                        </div>
                      )}
                      {account.monthlyWithdrawalLimit && (
                        <div>
                          <Text size="sm" c="dimmed">Monthly Withdrawals</Text>
                          <Text fw={500}>{account.monthlyWithdrawalLimit} allowed</Text>
                        </div>
                      )}
                      {account.interestRate && (
                        <div>
                          <Text size="sm" c="dimmed">Interest Rate</Text>
                          <Text fw={500}>{account.interestRate}%</Text>
                        </div>
                      )}
                      {account.monthlyPayment && (
                        <div>
                          <Text size="sm" c="dimmed">Monthly Payment</Text>
                          <Text fw={500}>
                            <NumberFormatter prefix="$" value={account.monthlyPayment} thousandSeparator />
                          </Text>
                        </div>
                      )}
                      {account.dueDate && (
                        <div>
                          <Text size="sm" c="dimmed">Next Due Date</Text>
                          <Text fw={500}>{formatDate(new Date(account.dueDate))}</Text>
                        </div>
                      )}
                    </SimpleGrid>
                  </Card>

                  {/* Transaction Statistics Card */}
                  <Card withBorder shadow="sm" radius="md">
                    <Title order={3} mb="md">Transaction Statistics</Title>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                      <div>
                        <Text size="sm" c="dimmed">Total Deposits</Text>
                        <Text fw={700} c="green" size="lg">
                          <NumberFormatter prefix="$" value={transactionStats.totalDeposits} thousandSeparator decimalScale={2} />
                        </Text>
                      </div>
                      <div>
                        <Text size="sm" c="dimmed">Total Withdrawals</Text>
                        <Text fw={700} c="red" size="lg">
                          <NumberFormatter prefix="$" value={transactionStats.totalWithdrawals} thousandSeparator decimalScale={2} />
                        </Text>
                      </div>
                      <div>
                        <Text size="sm" c="dimmed">Total Transfers</Text>
                        <Text fw={700} c="blue" size="lg">
                          <NumberFormatter prefix="$" value={transactionStats.totalTransfers} thousandSeparator decimalScale={2} />
                        </Text>
                      </div>
                      <div>
                        <Text size="sm" c="dimmed">Avg Transaction</Text>
                        <Text fw={700} size="lg">
                          <NumberFormatter prefix="$" value={transactionStats.avgTransaction} thousandSeparator decimalScale={2} />
                        </Text>
                      </div>
                    </SimpleGrid>
                  </Card>

                  {/* Recent Transactions */}
                  <Card withBorder shadow="sm" radius="md">
                    <Group justify="space-between" mb="md">
                      <Title order={3}>Recent Transactions</Title>
                      <Button
                        component={Link}
                        href={`/admin/accounts/${account.id}?tab=transactions`}
                        variant="light"
                        size="xs"
                      >
                        View All
                      </Button>
                    </Group>
                    {account.transactions.length > 0 ? (
                      <Table>
                        <TableThead>
                          <TableTr>
                            <TableTh>Date</TableTh>
                            <TableTh>Type</TableTh>
                            <TableTh>Amount</TableTh>
                            <TableTh>Status</TableTh>
                          </TableTr>
                        </TableThead>
                        <TableTbody>
                          {account.transactions.slice(0, 5).map((transaction: any) => (
                            <TableTr key={transaction.id}>
                              <TableTd>
                                <Text size="sm">{formatDate(transaction.createdAt)}</Text>
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
                                  <NumberFormatter
                                    prefix="$"
                                    value={transaction.amount}
                                    thousandSeparator
                                    decimalScale={2}
                                  />
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
                          No transactions found for this account.
                        </Text>
                      </Paper>
                    )}
                  </Card>
                </Stack>
              </GridCol>
            </Grid>
          </TabsPanel>

          {/* Transactions Tab */}
          <TabsPanel value="transactions">
            <Card withBorder shadow="sm" radius="md">
              <Group justify="space-between" mb="md">
                <Title order={3}>Transaction History</Title>
                <Text c="dimmed">{account.transactions.length} transactions</Text>
              </Group>
              {account.transactions.length > 0 ? (
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
                      {account.transactions.map((transaction: any) => (
                        <TableTr key={transaction.id}>
                          <TableTd>
                            <Text size="sm">{formatDate(transaction.createdAt)}</Text>
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
                              <NumberFormatter
                                prefix="$"
                                value={transaction.amount}
                                thousandSeparator
                                decimalScale={2}
                              />
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

          {/* Account Statement Tab */}
          <TabsPanel value="statement">
            <Card withBorder shadow="sm" radius="md">
              <Title order={3} mb="md">Account Statement</Title>
              {account.accountTransactions && account.accountTransactions.length > 0 ? (
                <TableScrollContainer minWidth={600}>
                  <Table>
                    <TableThead>
                      <TableTr>
                        <TableTh>Date</TableTh>
                        <TableTh>Transaction</TableTh>
                        <TableTh>Amount</TableTh>
                        <TableTh>Balance Before</TableTh>
                        <TableTh>Balance After</TableTh>
                      </TableTr>
                    </TableThead>
                    <TableTbody>
                      {account.accountTransactions.map((at: any) => (
                        <TableTr key={at.id}>
                          <TableTd>
                            <Text size="sm">{formatDate(at.createdAt)}</Text>
                          </TableTd>
                          <TableTd>
                            <div>
                              <Text size="sm" fw={500}>{at.transaction.referenceNumber}</Text>
                              <Text size="xs" c="dimmed">{at.transaction.transactionType.type}</Text>
                            </div>
                          </TableTd>
                          <TableTd>
                            <Text
                              fw={600}
                              c={at.transaction.transactionType.type === 'deposit' ? 'green' : 'red'}
                            >
                              <NumberFormatter
                                prefix="$"
                                value={at.transaction.amount}
                                thousandSeparator
                                decimalScale={2}
                              />
                            </Text>
                          </TableTd>
                          <TableTd>
                            <Text size="sm">
                              <NumberFormatter
                                prefix="$"
                                value={at.balanceBefore}
                                thousandSeparator
                                decimalScale={2}
                              />
                            </Text>
                          </TableTd>
                          <TableTd>
                            <Text size="sm" fw={500}>
                              <NumberFormatter
                                prefix="$"
                                value={at.balanceAfter}
                                thousandSeparator
                                decimalScale={2}
                              />
                            </Text>
                          </TableTd>
                        </TableTr>
                      ))}
                    </TableTbody>
                  </Table>
                </TableScrollContainer>
              ) : (
                <Paper p="xl" withBorder>
                  <Text ta="center" c="dimmed">
                    No statement data available.
                  </Text>
                </Paper>
              )}
            </Card>
          </TabsPanel>

          {/* Settings Tab - Only one instance */}
          <TabsPanel value="settings">
            <Card withBorder shadow="sm" radius="md">
              <Title order={3} mb="md">Account Settings</Title>
              <Stack gap="lg">
                <Button
                  component={Link}
                  href={`/admin/accounts?edit=${account.id}`}
                  variant="light"
                  leftSection={<IconSettings size={16} />}
                >
                  Edit Account Settings
                </Button>
                <Button
                  variant="light"
                  color="yellow"
                  leftSection={<IconLock size={16} />}
                >
                  Freeze Account
                </Button>
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconLock size={16} />}
                >
                  Close Account
                </Button>
                <Button
                  variant="light"
                  color="green"
                  leftSection={<IconCheck size={16} />}
                >
                  Reactivate Account
                </Button>
              </Stack>
            </Card>
          </TabsPanel>
        </Tabs>
      </Container>
    );
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