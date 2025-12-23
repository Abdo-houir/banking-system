'use client';

import { AccountStatus } from '@/generated/prisma/client';
import { updateAccount } from '@/lib/actions/admin/account';
import { getAccountStatuses } from '@/lib/actions/lookup';
import { Account } from '@/types/employee';
import { AdminAccountUpdateInput, adminAccountUpdateSchema } from '@/validation/admin';
import {
    Alert,
    Button,
    Card,
    Group,
    LoadingOverlay,
    NumberInput,
    Select,
    SimpleGrid,
    Stack,
    Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { zodResolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';

interface AccountModalProps {
    account: Account | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AccountModal({ account, onClose, onSuccess }: AccountModalProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [accountStatuses, setAccountStatuses] = useState<AccountStatus[]>([]);

    useEffect(() => {
        fetchAccountStatuses();
    }, []);

    const fetchAccountStatuses = async () => {
        try {
            const result = await getAccountStatuses();
            if (result.success) {
                if (result.data) {
                    setAccountStatuses(result.data.statuses);
                }
            }
        } catch (error) {
            console.error('Error fetching account statuses:', error);
        }
    };

    const form = useForm<AdminAccountUpdateInput>({
        initialValues: {
            accountStatusId: account?.accountStatus?.id || undefined,
            transactionLimit: account?.transactionLimit || undefined,
            minimumBalance: account?.minimumBalance || undefined,
            overdraftLimit: account?.overdraftLimit || undefined,
            monthlyWithdrawalLimit: account?.monthlyWithdrawalLimit || undefined,
            interestRate: account?.interestRate || undefined,
            loanAmount: account?.loanAmount || undefined,
            monthlyPayment: account?.monthlyPayment || undefined,
            minimumPayment: account?.minimumPayment || undefined,
            dueDate: account?.dueDate?.toISOString() || undefined,
        },
        validate: zodResolver(adminAccountUpdateSchema),
    });

    const handleSubmit = async (values: AdminAccountUpdateInput) => {
        if (!account) return;

        setLoading(true);
        setError(null);

        try {
            const result = await updateAccount(account.id, values);

            if (result.success) {
                notifications.show({
                    title: 'Success',
                    message: result.message,
                    color: 'green',
                    icon: <IconCheck size={18} />,
                });
                onSuccess();
            } else {
                // Handle validation errors
                if (result.errors) {
                    result.errors.forEach((err: any) => {
                        form.setFieldError(err.field, err.message);
                    });
                } else {
                    setError(result.message || 'Update failed');
                }
            }
        } catch (err) {
            console.error('Error updating account:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!account) return null;

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
                <LoadingOverlay visible={loading} />

                {error && (
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        title="Error"
                        color="red"
                        variant="filled"
                    >
                        {error}
                    </Alert>
                )}

                {/* Account Information */}
                <Card withBorder>
                    <Stack gap="sm">
                        <Text fw={500}>Account Information</Text>
                        <SimpleGrid cols={2}>
                            <div>
                                <Text size="sm" c="dimmed">Account Number</Text>
                                <Text fw={500}>{account.accountNumber}</Text>
                            </div>
                            <div>
                                <Text size="sm" c="dimmed">Account Type</Text>
                                <Text fw={500} tt="capitalize">{account.accountType.type}</Text>
                            </div>
                            <div>
                                <Text size="sm" c="dimmed">Customer</Text>
                                <Text fw={500}>
                                    {account.customer.firstName} {account.customer.lastName}
                                </Text>
                            </div>
                            <div>
                                <Text size="sm" c="dimmed">Current Balance</Text>
                                <Text fw={500} c={account.balance >= 0 ? 'green' : 'red'}>
                                    ${Math.abs(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Text>
                            </div>
                        </SimpleGrid>
                    </Stack>
                </Card>

                {/* Status Update */}
                <Select
                    label="Account Status"
                    data={accountStatuses.map(status => ({
                        value: status.id.toString(),
                        label: status.status,
                    }))}
                    value={form.values.accountStatusId?.toString() || ''}
                    onChange={(value) => form.setFieldValue('accountStatusId', value ? parseInt(value) : undefined)}
                    disabled={loading}
                />

                {/* Limits Configuration */}
                <SimpleGrid cols={2}>
                    <NumberInput
                        label="Transaction Limit"
                        placeholder="Enter amount"
                        prefix="$"
                        thousandSeparator=","
                        decimalScale={2}
                        {...form.getInputProps('transactionLimit')}
                        disabled={loading}
                    />
                    <NumberInput
                        label="Minimum Balance"
                        placeholder="Enter amount"
                        prefix="$"
                        thousandSeparator=","
                        decimalScale={2}
                        {...form.getInputProps('minimumBalance')}
                        disabled={loading}
                    />
                    <NumberInput
                        label="Overdraft Limit"
                        placeholder="Enter amount"
                        prefix="$"
                        thousandSeparator=","
                        decimalScale={2}
                        {...form.getInputProps('overdraftLimit')}
                        disabled={loading}
                    />
                    <NumberInput
                        label="Monthly Withdrawal Limit"
                        placeholder="Enter number"
                        {...form.getInputProps('monthlyWithdrawalLimit')}
                        disabled={loading}
                    />
                </SimpleGrid>

                {/* Interest & Loan Settings */}
                {(account.accountType.type === 'savings' || account.accountType.type === 'loan' || account.accountType.type === 'credit') && (
                    <SimpleGrid cols={account.accountType.type === 'savings' ? 1 : 2}>
                        <NumberInput
                            label="Interest Rate (%)"
                            placeholder="Enter rate"
                            decimalScale={2}
                            {...form.getInputProps('interestRate')}
                            disabled={loading}
                        />
                        {(account.accountType.type === 'loan' || account.accountType.type === 'credit') && (
                            <>
                                <NumberInput
                                    label="Loan/Credit Amount"
                                    placeholder="Enter amount"
                                    prefix="$"
                                    thousandSeparator=","
                                    decimalScale={2}
                                    {...form.getInputProps('loanAmount')}
                                    disabled={loading}
                                />
                                <NumberInput
                                    label="Monthly Payment"
                                    placeholder="Enter amount"
                                    prefix="$"
                                    thousandSeparator=","
                                    decimalScale={2}
                                    {...form.getInputProps('monthlyPayment')}
                                    disabled={loading}
                                />
                                <NumberInput
                                    label="Minimum Payment"
                                    placeholder="Enter amount"
                                    prefix="$"
                                    thousandSeparator=","
                                    decimalScale={2}
                                    {...form.getInputProps('minimumPayment')}
                                    disabled={loading}
                                />
                            </>
                        )}
                    </SimpleGrid>
                )}

                <Group justify="flex-end" mt="md">
                    <Button variant="light" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading}>
                        Update Account
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}