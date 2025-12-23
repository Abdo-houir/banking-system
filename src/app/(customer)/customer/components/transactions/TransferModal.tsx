'use client';

import { ApiResponse, TransferResponse } from '@/types/api';
import { TransferData, TransferSchema, generateReferenceNumber } from '@/validation/transaction';
import {
    Alert,
    Badge,
    Button,
    Card,
    Group,
    LoadingOverlay,
    Modal,
    NumberInput,
    Radio,
    Select,
    Stack,
    Text,
    TextInput,
    Title
} from '@mantine/core';
import { DatePickerInput } from "@mantine/dates";
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
    IconCalendar,
    IconCheck,
    IconCoin,
    IconInfoCircle,
    IconTransfer,
    IconX
} from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
interface TransferModalProps {
    opened?: boolean;
    onClose?: () => void;
    accounts: Array<{ id: number; accountNumber: string; balance: number; type: string }>;
    onSuccess?: () => void;
}

export default function TransferModal({
    opened: externalOpened,
    onClose: externalOnClose,
    accounts,
    onSuccess
}: TransferModalProps) {
    const [internalOpened, setInternalOpened] = useState(false);
    const [loading, setLoading] = useState(false);

    const opened = externalOpened !== undefined ? externalOpened : internalOpened;
    const onClose = externalOnClose || (() => setInternalOpened(false));

    const form = useForm<TransferData & { reference: string }>({
        initialValues: {
            fromAccountId: '',
            toAccountNumber: '',
            amount: 0,
            description: '',
            isScheduled: false,
            scheduleDate: '',
            accountId: "",
            scheduledFor: undefined,
            reference: generateReferenceNumber('transfer'), // Generate reference on init
        },

        validate: zod4Resolver(TransferSchema),

        validateInputOnBlur: true,
    });

    useEffect(() => {
        form.setValues({ accountId: form.values.fromAccountId })
    }, [form.values.fromAccountId]);

    const handleSubmit = async (values: TransferData & { reference: string }) => {
        setLoading(true);
        try {
            // Prepare the data for API
            const apiData = {
                ...values,
                accountId: values.fromAccountId, // Sync accountId with fromAccountId
                reference: values.reference || generateReferenceNumber('transfer'), // Ensure reference exists
            };

            const response = await fetch('/api/transactions/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData),
            });

            const data: ApiResponse<TransferResponse> = await response.json();

            if (data.success && data.data) {
                notifications.show({
                    title: data.data.needsApproval ? 'Transfer Submitted' : 'Transfer Successful',
                    message: data.message || `Successfully transferred $${values.amount.toFixed(2)}`,
                    color: 'green',
                    icon: <IconCheck size={18} />,
                });

                form.reset();
                onClose();
                onSuccess?.();
            } else {
                notifications.show({
                    title: 'Transfer Failed',
                    message: data.message || 'Please try again',
                    color: 'red',
                    icon: <IconX size={18} />,
                });

                // Show field errors if any
                if (data.errors?.length) {
                    data.errors.forEach(error => {
                        if (error.field) {
                            form.setFieldError(error.field, error.message);
                        }
                    });
                }
            }
        } catch (error: any) {
            notifications.show({
                title: 'Error',
                message: error.message || 'Network error. Please try again.',
                color: 'red',
                icon: <IconX size={18} />,
            });
        } finally {
            setLoading(false);
        }
    };

    const selectedAccount = accounts.find(acc => acc.id.toString() === form.values.fromAccountId);
    const availableBalance = selectedAccount
        ? selectedAccount.balance + (selectedAccount.type === 'checking' ? 500 : 0) // Overdraft for checking
        : 0;

    const maxAmount = Math.min(
        availableBalance,
        selectedAccount?.type === 'savings' ? 5000 : 10000 // Transaction limit
    );

    return (
        <>
            {!externalOpened && (
                <Button
                    leftSection={<IconTransfer size={16} />}
                    onClick={() => setInternalOpened(true)}
                    variant="light"
                    color="blue"
                >
                    Transfer Money
                </Button>
            )}

            <Modal
                opened={opened}
                onClose={onClose}
                title={
                    <Group gap="sm">
                        <IconTransfer size={24} />
                        <Title order={4}>Transfer Funds</Title>
                    </Group>
                }
                size="lg"
                centered
                padding="xl"
            >
                <LoadingOverlay visible={loading} zIndex={1000} />

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="md">
                        {/* Step 1: Source Account */}
                        <Card withBorder radius="md" p="md">
                            <Text fw={600} mb="xs">1. Source Account</Text>
                            <Select
                                label="From Account"
                                placeholder="Select source account"
                                data={accounts.map(acc => ({
                                    value: acc.id.toString(),
                                    label: `${acc.accountNumber} - ${acc.type.toUpperCase()} - Balance: $${acc.balance.toFixed(2)}`
                                }))}
                                {...form.getInputProps('fromAccountId')}
                                error={form.errors.fromAccountId}
                            />

                            {selectedAccount && (
                                <Alert color="blue" icon={<IconInfoCircle size={16} />} mt="md">
                                    <Text size="sm">
                                        Available: ${availableBalance.toFixed(2)}
                                        {selectedAccount.type === 'savings' && ` (6 withdrawals remaining this month)`}
                                    </Text>
                                </Alert>
                            )}
                        </Card>

                        {/* Step 2: Destination */}
                        <Card withBorder radius="md" p="md">
                            <Text fw={600} mb="xs">2. Destination</Text>
                            <TextInput
                                label="To Account Number"
                                placeholder="Enter recipient account number"
                                description="Enter the full account number of the recipient"
                                {...form.getInputProps('toAccountNumber')}
                                error={form.errors.toAccountNumber}
                                disabled={!form.values.fromAccountId}
                            />

                            <NumberInput
                                label="Amount"
                                placeholder="0.00"
                                leftSection={<IconCoin size={16} />}
                                prefix="$"
                                min={0.01}
                                max={maxAmount}
                                step={0.01}
                                {...form.getInputProps('amount')}
                                error={form.errors.amount}
                                disabled={!form.values.toAccountNumber}
                            />

                            <TextInput
                                label="Description"
                                placeholder="e.g., Rent payment, Gift, Repayment"
                                description="Add a note for your records"
                                {...form.getInputProps('description')}
                            />
                        </Card>

                        {/* Step 3: Options */}
                        <Card withBorder radius="md" p="md">
                            <Text fw={600} mb="xs">3. Transfer Options</Text>
                            <Radio.Group
                                label="When to Transfer"
                                value={form.values.isScheduled ? 'true' : 'false'}
                                onChange={(value) => form.setFieldValue('isScheduled', value === 'true')}
                            >
                                <Stack gap="xs" mt="xs">
                                    <Radio
                                        value="false"
                                        label="Transfer Now"
                                    />
                                    <Radio
                                        value="true"
                                        label="Schedule for Later"
                                    />
                                </Stack>
                            </Radio.Group>

                            {form.values.isScheduled && (
                                <DatePickerInput
                                    label="Schedule Date"
                                    leftSection={<IconCalendar size={16} />}
                                    mt="md"
                                    {...form.getInputProps('scheduledFor')}
                                    error={form.errors.scheduledFor}
                                />
                            )}
                        </Card>

                        {/* Hidden reference field */}
                        <input type="hidden" {...form.getInputProps('reference')} />

                        {/* Summary & Fees */}
                        {form.values.amount > 0 && (
                            <Card withBorder radius="md" p="md" >
                                <Text fw={600} mb="xs">Transfer Summary</Text>
                                <Stack gap={4}>
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Amount:</Text>
                                        <Text size="sm" fw={500}>${form.values.amount.toFixed(2)}</Text>
                                    </Group>
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Fee:</Text>
                                        <Text size="sm" fw={500}>$2.00</Text>
                                    </Group>
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Total:</Text>
                                        <Text size="sm" fw={500}>${(form.values.amount + 2.00).toFixed(2)}</Text>
                                    </Group>
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">New Balance:</Text>
                                        <Text size="sm" fw={500}>
                                            ${(availableBalance - form.values.amount - 2.00).toFixed(2)}
                                        </Text>
                                    </Group>
                                    <Group justify="space-between">
                                        <Text size="sm" c="dimmed">Reference:</Text>
                                        <Text size="sm" fw={500} style={{ fontFamily: 'monospace' }}>
                                            {form.values.reference}
                                        </Text>
                                    </Group>
                                </Stack>

                                {form.values.amount > 5000 && (
                                    <Badge color="orange" variant="light" mt="md">
                                        Requires Manager Approval
                                    </Badge>
                                )}
                            </Card>
                        )}

                        {/* Terms & Conditions */}
                        <Alert color="blue" icon={<IconInfoCircle size={16} />}>
                            <Text size="sm">
                                <strong>Important:</strong> Transfers are processed on business days.
                                Transfers over $5,000 require approval and may take 1-2 business days.
                                Reference: <strong>{form.values.reference}</strong>
                            </Text>
                        </Alert>

                        <Group justify="space-between" mt="md">
                            <Button variant="default" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={loading}
                                leftSection={<IconTransfer size={16} />}
                            >
                                {form.values.isScheduled ? 'Schedule Transfer' : 'Transfer Now'}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </>
    );
}