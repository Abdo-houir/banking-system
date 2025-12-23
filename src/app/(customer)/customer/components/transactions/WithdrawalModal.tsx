// components/transactions/WithdrawalModal.tsx
'use client';

import { ApiResponse } from '@/types/api';
import { WithdrawalData, WithdrawalSchema } from '@/validation/transaction';
import {
    Alert,
    Button,
    Group,
    LoadingOverlay,
    Modal,
    NumberInput,
    PasswordInput,
    Radio,
    Select,
    Stack,
    Text,
    TextInput,
    Title
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
    IconCash,
    IconCheck,
    IconCoin,
    IconInfoCircle,
    IconLock,
    IconX
} from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';

interface WithdrawalModalProps {
  opened?: boolean;
  onClose?: () => void;
  accounts: Array<{ id: number; accountNumber: string; balance: number; type: string }>;
  onSuccess?: () => void;
}

export default function WithdrawalModal({ 
  opened: externalOpened, 
  onClose: externalOnClose, 
  accounts,
  onSuccess 
}: WithdrawalModalProps) {
  const [internalOpened, setInternalOpened] = useState(false);
  const [loading, setLoading] = useState(false);

  const opened = externalOpened !== undefined ? externalOpened : internalOpened;
  const onClose = externalOnClose || (() => setInternalOpened(false));

  const form = useForm<WithdrawalData>({
    initialValues: {
      accountId: '',
      amount: 0,
      description: '',
      withdrawalMethod: 'cash',
      pin: '',
      recipientAccount: '',
    },
    
    validate: zod4Resolver(WithdrawalSchema),
    
    validateInputOnBlur: true,
  });

  const handleSubmit = async (values: WithdrawalData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/transactions/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        notifications.show({
          title: 'Withdrawal Successful',
          message: data.message || `Withdrawal of $${values.amount.toFixed(2)} processed`,
          color: 'green',
          icon: <IconCheck size={18} />,
        });

        form.reset();
        onClose();
        onSuccess?.();
      } else {
        notifications.show({
          title: 'Withdrawal Failed',
          message: data.message || 'Please try again',
          color: 'red',
          icon: <IconX size={18} />,
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to process withdrawal',
        color: 'red',
        icon: <IconX size={18} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find(acc => acc.id.toString() === form.values.accountId);
  const availableBalance = selectedAccount?.balance || 0;
  const isSavings = selectedAccount?.type === 'savings';

  return (
    <>
      {!externalOpened && (
        <Button
          leftSection={<IconCash size={16} />}
          onClick={() => setInternalOpened(true)}
          variant="light"
          color="red"
        >
          Withdraw Funds
        </Button>
      )}

      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap="sm">
            <IconCash size={24} />
            <Title order={4}>Withdraw Funds</Title>
          </Group>
        }
        size="md"
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

            {selectedAccount && (
              <Alert color={availableBalance > 0 ? 'blue' : 'red'} icon={<IconInfoCircle size={16} />}>
                <Text size="sm">
                  Available balance: ${availableBalance.toFixed(2)}
                  {isSavings && ' (6 withdrawals/month limit)'}
                </Text>
              </Alert>
            )}

            <Radio.Group
              label="Withdrawal Method"
              {...form.getInputProps('withdrawalMethod')}
            >
              <Stack gap="xs" mt="xs">
                <Radio value="cash" label="Cash Withdrawal" />
                <Radio value="check" label="Check" />
                <Radio value="transfer" label="Transfer to Another Account" />
              </Stack>
            </Radio.Group>

            {form.values.withdrawalMethod === 'transfer' && (
              <TextInput
                label="Recipient Account"
                placeholder="Enter account number"
                {...form.getInputProps('recipientAccount')}
                required
              />
            )}

            <NumberInput
              label="Amount"
              placeholder="0.00"
              leftSection={<IconCoin size={16} />}
              prefix="$"
              min={1}
              max={Math.min(availableBalance, 10000)}
              step={0.01}
              {...form.getInputProps('amount')}
              required
            />

            <TextInput
              label="Description"
              placeholder="e.g., Emergency funds, Vacation money"
              {...form.getInputProps('description')}
            />

            <PasswordInput
              label="PIN"
              placeholder="Enter your PIN"
              leftSection={<IconLock size={16} />}
              {...form.getInputProps('pin')}
              required
              maxLength={6}
            />

            <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
              <Text size="sm">
                <strong>Important:</strong> 
                {isSavings && ' Savings accounts have a 6 withdrawal/month limit. '}
                Daily withdrawal limit: $10,000. Cash withdrawals over $3,000 require ID verification.
              </Text>
            </Alert>

            <Group justify="space-between" mt="md">
              <Button variant="default" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" loading={loading} disabled={!form.isValid()}>
                Process Withdrawal
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}