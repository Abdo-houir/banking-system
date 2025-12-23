// components/transactions/TransactionReceipt.tsx
'use client';

import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineTheme
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconBuildingBank,
  IconCheck,
  IconCurrencyDollar,
  IconDownload,
  IconMail,
  IconPrinter,
  IconQrcode,
  IconShare,
  IconUser
} from '@tabler/icons-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { BiCheckCircle } from 'react-icons/bi';
import { BsCheckCircle } from 'react-icons/bs';

interface TransactionReceiptProps {
  transaction: any;
  bankInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    routingNumber: string;
    swiftCode: string;
  };
  user: any;
}

export default function TransactionReceipt({
  transaction,
  bankInfo,
  user,
}: TransactionReceiptProps) {
  const router = useRouter();
  const theme = useMantineTheme();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const isTransfer = transaction.transactionType.type === 'transfer';
  const isDeposit = transaction.transactionType.type === 'deposit';
  const isWithdrawal = transaction.transactionType.type === 'withdrawal';
  const isIncoming = transaction.amount > 0;
  const isCompleted = transaction.transactionStatus.status === 'completed';
  
  
  // Download as PDF
  const downloadPDF = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`receipt-${transaction.referenceNumber}.pdf`);
      
      notifications.show({
        title: 'PDF Downloaded',
        message: 'Receipt has been saved as PDF',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error) {
      console.log(error);
      notifications.show({
        title: 'Error',
        message: 'Failed to generate PDF',
        color: 'red',
      });
    }
  };
  
  // Print receipt
  const printReceipt = () => {
    window.print();
  };
  
  // Share receipt
  const shareReceipt = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Transaction Receipt - ${transaction.referenceNumber}`,
          text: `Transaction ${transaction.referenceNumber} for ${formatCurrency(transaction.amount)}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Sharing cancelled',error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      notifications.show({
        title: 'Link Copied',
        message: 'Receipt link copied to clipboard',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    }
  };
  
  // Send receipt via email (mock function)
  const sendEmail = () => {
    notifications.show({
      title: 'Email Sent',
      message: 'Receipt has been sent to your email',
      color: 'green',
      icon: <IconCheck size={16} />,
    });
  };
  
  return (
    <Container size="lg" py="xl">
      {/* Header with Actions */}
      <Group justify="space-between" mb="xl">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Back to Transaction
        </Button>
        
        <Group>
          <Button
            variant="light"
            leftSection={<IconDownload size={16} />}
            onClick={downloadPDF}
          >
            Download PDF
          </Button>
          <Button
            variant="light"
            leftSection={<IconPrinter size={16} />}
            onClick={printReceipt}
          >
            Print
          </Button>
          <Button
            variant="light"
            leftSection={<IconShare size={16} />}
            onClick={shareReceipt}
          >
            Share
          </Button>
          <Button
            variant="light"
            leftSection={<IconMail size={16} />}
            onClick={sendEmail}
          >
            Email
          </Button>
        </Group>
      </Group>
      
      {/* Receipt Container */}
      <Paper
        ref={receiptRef}
        withBorder
        radius="md"
        p="xl"
        style={{
          maxWidth: 800,
          margin: '0 auto',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Header */}
        <Group justify="space-between" mb="lg">
          <div>
            <Title order={2} c={theme.primaryColor}>
              {bankInfo.name}
            </Title>
            <Text size="sm" c="dimmed">
              {bankInfo.address}
            </Text>
            <Text size="sm" c="dimmed">
              {bankInfo.phone} • {bankInfo.email}
            </Text>
          </div>
          
          <Stack align="flex-end">
            <Badge
              size="lg"
              color="green"
              variant="light"
              leftSection={<BiCheckCircle size={14} />}
            >
              {isCompleted ? 'PAID' : 'PENDING'}
            </Badge>
            <Text fw={600}>RECEIPT</Text>
          </Stack>
        </Group>
        
        <Divider my="lg" />
        
        {/* Transaction Details */}
        <Stack gap="lg" mb="lg">
          {/* Amount */}
          <Group justify="center">
            <Text fz={48} fw={900} c={isIncoming ? 'green' : 'red'}>
              {isIncoming ? '+' : ''}{formatCurrency(transaction.amount)}
            </Text>
          </Group>
          
          {/* Transaction Info */}
          <SimpleGrid cols={2} spacing="lg">
            <Stack gap="xs">
              <Text fz="sm" c="dimmed">Transaction ID</Text>
              <Text fz="lg" fw={600}>#{transaction.id}</Text>
            </Stack>
            
            <Stack gap="xs">
              <Text fz="sm" c="dimmed">Reference Number</Text>
              <Text fz="lg" fw={600} style={{ fontFamily: 'monospace' }}>
                {transaction.referenceNumber}
              </Text>
            </Stack>
            
            <Stack gap="xs">
              <Text fz="sm" c="dimmed">Date & Time</Text>
              <Text fz="lg" fw={600}>{formatDateTime(transaction.createdAt)}</Text>
            </Stack>
            
            <Stack gap="xs">
              <Text fz="sm" c="dimmed">Transaction Type</Text>
              <Badge
                size="lg"
                variant="light"
                color={
                  isTransfer ? 'blue' :
                  isDeposit ? 'green' :
                  isWithdrawal ? 'red' :
                  'orange'
                }
              >
                {transaction.transactionType.type.toUpperCase()}
              </Badge>
            </Stack>
          </SimpleGrid>
          
          {/* Description */}
          {transaction.description && (
            <Card withBorder>
              <Text fw={600} mb="xs">Description</Text>
              <Text>{transaction.description}</Text>
            </Card>
          )}
          
          {/* Accounts Section */}
          <Card withBorder>
            <Text fw={600} mb="md">Account Details</Text>
            
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              {/* Primary Account */}
              <Stack gap="xs">
                <Text fz="sm" c="dimmed">Primary Account</Text>
                <Group gap="sm">
                  <ThemeIcon size={30} radius="md" variant="light">
                    <IconBuildingBank size={16} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600}>{transaction.account.accountNumber}</Text>
                    <Text size="sm" c="dimmed">
                      {transaction.account.customer.firstName} {transaction.account.customer.lastName}
                    </Text>
                  </div>
                </Group>
              </Stack>
              
              {/* Balance Impact */}
              {transaction.accountTransactions[0] && (
                <Stack gap="xs">
                  <Text fz="sm" c="dimmed">Balance Impact</Text>
                  <Group gap="sm">
                    <ThemeIcon size={30} radius="md" variant="light">
                      <IconCurrencyDollar size={16} />
                    </ThemeIcon>
                    <div>
                      <Text fw={600}>
                        {formatCurrency(transaction.accountTransactions[0].balanceAfter)}
                      </Text>
                      <Text size="sm" c="dimmed">
                        Updated Balance
                      </Text>
                    </div>
                  </Group>
                </Stack>
              )}
              
              {/* From Account (for transfers) */}
              {transaction.fromAccount && (
                <Stack gap="xs">
                  <Text fz="sm" c="dimmed">Source Account</Text>
                  <Group gap="sm">
                    <ThemeIcon size={30} radius="md" variant="light" color="red">
                      <IconBuildingBank size={16} />
                    </ThemeIcon>
                    <div>
                      <Text fw={600}>{transaction.fromAccount.accountNumber}</Text>
                      <Text size="sm" c="dimmed">
                        {transaction.fromAccount.customer.firstName} {transaction.fromAccount.customer.lastName}
                      </Text>
                    </div>
                  </Group>
                </Stack>
              )}
              
              {/* To Account (for transfers/payments) */}
              {transaction.toAccount && (
                <Stack gap="xs">
                  <Text fz="sm" c="dimmed">Destination Account</Text>
                  <Group gap="sm">
                    <ThemeIcon size={30} radius="md" variant="light" color="green">
                      <IconBuildingBank size={16} />
                    </ThemeIcon>
                    <div>
                      <Text fw={600}>{transaction.toAccount.accountNumber}</Text>
                      <Text size="sm" c="dimmed">
                        {transaction.toAccount.customer.firstName} {transaction.toAccount.customer.lastName}
                      </Text>
                    </div>
                  </Group>
                </Stack>
              )}
            </SimpleGrid>
          </Card>
          
          {/* Customer Info */}
          <Card withBorder>
            <Text fw={600} mb="md">Customer Information</Text>
            
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <Stack gap="xs">
                <Text fz="sm" c="dimmed">Name</Text>
                <Group gap="sm">
                  <ThemeIcon size={30} radius="md" variant="light">
                    <IconUser size={16} />
                  </ThemeIcon>
                  <Text fw={600}>
                    {user.firstName} {user.lastName}
                  </Text>
                </Group>
              </Stack>
              
              <Stack gap="xs">
                <Text fz="sm" c="dimmed">Email</Text>
                <Text fw={600}>{user.email}</Text>
              </Stack>
              
              <Stack gap="xs">
                <Text fz="sm" c="dimmed">Customer ID</Text>
                <Text fw={600}>{user.id}</Text>
              </Stack>
              
              <Stack gap="xs">
                <Text fz="sm" c="dimmed">Initiated By</Text>
                <Text fw={600}>
                  {transaction.user.firstName} {transaction.user.lastName}
                </Text>
              </Stack>
            </SimpleGrid>
          </Card>
          
          {/* Bank Info */}
          <Card withBorder>
            <Text fw={600} mb="md">Bank Information</Text>
            
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <Stack gap="xs">
                <Text fz="sm" c="dimmed">Bank Name</Text>
                <Text fw={600}>{bankInfo.name}</Text>
              </Stack>
              
              <Stack gap="xs">
                <Text fz="sm" c="dimmed">Routing Number</Text>
                <Text fw={600}>{bankInfo.routingNumber}</Text>
              </Stack>
              
              <Stack gap="xs">
                <Text fz="sm" c="dimmed">SWIFT Code</Text>
                <Text fw={600}>{bankInfo.swiftCode}</Text>
              </Stack>
              
              <Stack gap="xs">
                <Text fz="sm" c="dimmed">Website</Text>
                <Text fw={600}>{bankInfo.website}</Text>
              </Stack>
            </SimpleGrid>
          </Card>
          
          {/* Important Notes */}
          <Alert color="blue" variant="light" icon={<BsCheckCircle size={16} />}>
            <Text size="sm">
              This receipt serves as proof of transaction. Please keep this receipt for your records.
              If you have any questions about this transaction, contact our customer service.
            </Text>
          </Alert>
          
          {/* Verification QR Code (Placeholder) */}
          <Card withBorder>
            <Group justify="center">
              <Stack align="center" gap="xs">
                <ThemeIcon size={80} radius="md" variant="light">
                  <IconQrcode size={40} />
                </ThemeIcon>
                <Text fz="sm" c="dimmed" ta="center">
                  Scan to verify transaction
                </Text>
                <Text fz="xs" c="dimmed" ta="center" style={{ fontFamily: 'monospace' }}>
                  {transaction.referenceNumber}
                </Text>
              </Stack>
            </Group>
          </Card>
        </Stack>
        
        {/* Footer */}
        <Divider my="lg" />
        
        <Group justify="space-between">
          <Stack gap={4}>
            <Text size="sm" c="dimmed">Generated on</Text>
            <Text size="sm" fw={500}>{formatDateTime(new Date())}</Text>
          </Stack>
          
          <Stack gap={4} align="flex-end">
            <Text size="sm" c="dimmed">Transaction Status</Text>
            <Badge
              color={isCompleted ? 'green' : 'yellow'}
              variant="light"
            >
              {transaction.transactionStatus.status.toUpperCase()}
            </Badge>
          </Stack>
        </Group>
        
        {/* Print-only message */}
        <Box style={{ display: 'none' }} className="print-only">
          <Text size="xs" c="dimmed" mt="lg" ta="center">
            This is an electronically generated receipt. No signature required.
          </Text>
        </Box>
      </Paper>
      
      {/* Footer Actions */}
      <Group justify="center" mt="xl">
        <Button
          variant="light"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => router.back()}
        >
          Back to Transaction
        </Button>
        
        <Button
          variant="light"
          leftSection={<IconPrinter size={16} />}
          onClick={printReceipt}
        >
          Print Receipt
        </Button>
        
        <Button
          component={Link}
          href={`/customer/transactions/${transaction.id}`}
          variant="filled"
        >
          View Full Details
        </Button>
      </Group>
      
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only {
            display: block !important;
          }
          .print-receipt,
          .print-receipt * {
            visibility: visible;
          }
          .print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Container>
  );
}