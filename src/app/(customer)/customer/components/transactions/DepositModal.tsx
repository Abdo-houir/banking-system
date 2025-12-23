// components/transactions/DepositModal.tsx
'use client';

import { ApiResponse } from '@/types/api';
import { DepositData, DepositSchema } from '@/validation/transaction';
import {
  Alert,
  Button,
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
  IconCheck,
  IconCoin,
  IconInfoCircle,
  IconReceipt,
  IconX
} from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';

interface DepositModalProps {
  opened?: boolean;
  onClose?: () => void;
  accounts: Array<{ id: number; accountNumber: string; balance: number; type: string }>;
  onSuccess?: () => void;
}

export default function DepositModal({ 
  opened: externalOpened, 
  onClose: externalOnClose, 
  accounts,
  onSuccess 
}: DepositModalProps) {
  const [internalOpened, setInternalOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  const opened = externalOpened !== undefined ? externalOpened : internalOpened;
  const onClose = externalOnClose || (() => setInternalOpened(false));

  const form = useForm<DepositData>({
    initialValues: {
      accountId: '',
      amount: 0,
      description: '',
      depositMethod: 'cash',
      checkNumber: '',
    },
    
    validate: zod4Resolver(DepositSchema),
    
    validateInputOnBlur: true,
  });

  const handleSubmit = async (values: DepositData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/transactions/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        notifications.show({
          title: 'Deposit Successful',
          message: data.message || `Deposit of $${values.amount.toFixed(2)} processed`,
          color: 'green',
          icon: <IconCheck size={18} />,
        });

        form.reset();
        onClose();
        onSuccess?.();
      } else {
        notifications.show({
          title: 'Deposit Failed',
          message: data.message || 'Please try again',
          color: 'red',
          icon: <IconX size={18} />,
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to process deposit',
        color: 'red',
        icon: <IconX size={18} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedMethod = form.values.depositMethod;
  const maxAmount = selectedMethod === 'cash' ? 10000 : 50000;

  return (
    <>
      {!externalOpened && (
        <Button
          leftSection={<IconReceipt size={16} />}
          onClick={() => setInternalOpened(true)}
          variant="light"
          color="green"
        >
          Make Deposit
        </Button>
      )}

      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap="sm">
            <IconReceipt size={24} />
            <Title order={4}>Make a Deposit</Title>
          </Group>
        }
        size="md"
        centered
      >
        <LoadingOverlay visible={loading} zIndex={1000} />
        
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Select
              label="To Account"
              placeholder="Select account"
              data={accounts.map(acc => ({
                value: acc.id.toString(),
                label: `${acc.accountNumber} - $${acc.balance.toFixed(2)}`
              }))}
              {...form.getInputProps('accountId')}
              required
            />

            <Select
              label="Deposit Method"
              data={[
                { value: 'cash', label: 'Cash Deposit' },
                { value: 'check', label: 'Check Deposit' },
                { value: 'ach', label: 'ACH Transfer' },
                { value: 'wire', label: 'Wire Transfer' },
              ]}
              {...form.getInputProps('depositMethod')}
              required
            />

            {form.values.depositMethod === 'check' && (
              <TextInput
                label="Check Number"
                placeholder="Enter check number"
                {...form.getInputProps('checkNumber')}
                required
              />
            )}

            <NumberInput
              label="Amount"
              placeholder="0.00"
              leftSection={<IconCoin size={16} />}
              prefix="$"
              min={1}
              max={maxAmount}
              step={0.01}
              {...form.getInputProps('amount')}
              required
            />

            <TextInput
              label="Description"
              placeholder="e.g., Paycheck, Gift, Tax refund"
              {...form.getInputProps('description')}
            />

            <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
              <Text size="sm">
                Note: {selectedMethod === 'cash' ? 'Cash deposits available immediately.' : 
                       selectedMethod === 'check' ? 'Check deposits may take 2 business days to clear.' :
                       selectedMethod === 'ach' ? 'ACH transfers take 1-2 business days.' :
                       'Wire transfers are typically same-day.'}
                Maximum {selectedMethod} deposit: ${maxAmount.toLocaleString()}.
              </Text>
            </Alert>

            <Group justify="space-between" mt="md">
              <Button variant="default" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" loading={loading} disabled={!form.isValid()}>
                Process Deposit
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}