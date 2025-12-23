// components/transactions/PaymentModal.tsx
'use client';

import { ApiResponse } from '@/types/api';
import { PaymentData, PaymentSchema } from '@/validation/transaction';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconCalendar,
  IconCheck,
  IconCoin,
  IconInfoCircle,
  IconReceipt2,
  IconRepeat,
  IconX
} from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';

interface PaymentModalProps {
  opened?: boolean;
  onClose?: () => void;
  accounts: Array<{ id: number; accountNumber: string; balance: number; type: string }>;
  payees?: Array<{ id: string; name: string; account: string; type: string }>;
  onSuccess?: () => void;
}

export default function PaymentModal({ 
  opened: externalOpened, 
  onClose: externalOnClose, 
  accounts,
  payees = [],
  onSuccess 
}: PaymentModalProps) {
  const [internalOpened, setInternalOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  const opened = externalOpened !== undefined ? externalOpened : internalOpened;
  const onClose = externalOnClose || (() => setInternalOpened(false));

  const form = useForm<PaymentData>({
    initialValues: {
      accountId: '',
      amount: 0,
      description: '',
      payeeName: '',
      payeeAccount: '',
      billType: 'utility',
      isRecurring: false,
      recurringFrequency: 'monthly',
      dueDate: '',
    },
    
    validate: zod4Resolver(PaymentSchema),
    
    validateInputOnBlur: true,
  });

  const handleSubmit = async (values: PaymentData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/transactions/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        notifications.show({
          title: values.isRecurring ? 'Payment Scheduled' : 'Payment Successful',
          message: data.message || `Payment of $${values.amount.toFixed(2)} sent`,
          color: 'green',
          icon: <IconCheck size={18} />,
        });

        form.reset();
        onClose();
        onSuccess?.();
      } else {
        notifications.show({
          title: 'Payment Failed',
          message: data.message || 'Please try again',
          color: 'red',
          icon: <IconX size={18} />,
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to process payment',
        color: 'red',
        icon: <IconX size={18} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find(acc => acc.id.toString() === form.values.accountId);
  const availableBalance = selectedAccount?.balance || 0;

  return (
    <>
      {!externalOpened && (
        <Button
          leftSection={<IconReceipt2 size={16} />}
          onClick={() => setInternalOpened(true)}
          variant="light"
          color="orange"
        >
          Pay Bill
        </Button>
      )}

      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap="sm">
            <IconReceipt2 size={24} />
            <Title order={4}>Pay Bill</Title>
          </Group>
        }
        size="lg"
        centered
      >
        <LoadingOverlay visible={loading} zIndex={1000} />
        
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Select
              label="From Account"
              placeholder="Select account"
              data={accounts.map(acc => ({
                value: acc.id.toString(),
                label: `${acc.accountNumber} - $${acc.balance.toFixed(2)}`
              }))}
              {...form.getInputProps('accountId')}
              required
            />

            <Select
              label="Payee"
              placeholder="Select or add payee"
              data={[
                ...payees.map(p => ({ value: p.id, label: `${p.name} - ${p.account}` })),
                { value: 'new', label: '+ Add New Payee' }
              ]}
              onChange={(value) => {
                if (value === 'new') {
                  form.setFieldValue('payeeName', '');
                  form.setFieldValue('payeeAccount', '');
                } else if (value) {
                  const payee = payees.find(p => p.id === value);
                  if (payee) {
                    form.setFieldValue('payeeName', payee.name);
                    form.setFieldValue('payeeAccount', payee.account);
                  }
                }
              }}
            />

            <TextInput
              label="Payee Name"
              placeholder="e.g., Electric Company, Credit Card"
              {...form.getInputProps('payeeName')}
              required
            />

            <TextInput
              label="Payee Account Number"
              placeholder="Your account number with the payee"
              {...form.getInputProps('payeeAccount')}
              required
            />

            <Select
              label="Bill Type"
              data={[
                { value: 'utility', label: 'Utility Bill' },
                { value: 'credit_card', label: 'Credit Card' },
                { value: 'loan', label: 'Loan Payment' },
                { value: 'mortgage', label: 'Mortgage' },
                { value: 'insurance', label: 'Insurance' },
                { value: 'other', label: 'Other' },
              ]}
              {...form.getInputProps('billType')}
              required
            />

            <NumberInput
              label="Amount"
              placeholder="0.00"
              leftSection={<IconCoin size={16} />}
              prefix="$"
              min={1}
              max={availableBalance}
              step={0.01}
              {...form.getInputProps('amount')}
              required
            />

            <TextInput
              label="Description"
              placeholder="e.g., October electricity bill, Credit card payment"
              {...form.getInputProps('description')}
            />

            <TextInput
              type="date"
              label="Due Date (Optional)"
              leftSection={<IconCalendar size={16} />}
              min={new Date().toISOString().split('T')[0]}
              {...form.getInputProps('dueDate')}
            />

            <Card withBorder radius="md" p="md">
              <Checkbox
                label="Set up as recurring payment"
                {...form.getInputProps('isRecurring', { type: 'checkbox' })}
              />
              
              {form.values.isRecurring && (
                <Select
                  label="Recurring Frequency"
                  data={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: 'Quarterly' },
                    { value: 'annually', label: 'Annually' },
                  ]}
                  leftSection={<IconRepeat size={16} />}
                  mt="md"
                  {...form.getInputProps('recurringFrequency')}
                  required={form.values.isRecurring}
                />
              )}
            </Card>

            <Alert color="blue" icon={<IconInfoCircle size={16} />}>
              <Text size="sm">
                Bill payments are processed within 1-2 business days.
                A $1.00 service fee applies to all bill payments.
                Scheduled payments will be processed on the due date.
              </Text>
            </Alert>

            <Group justify="space-between" mt="md">
              <Button variant="default" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={loading} 
                disabled={!form.isValid()}
                color="orange"
              >
                {form.values.isRecurring ? 'Schedule Payment' : 'Pay Now'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}