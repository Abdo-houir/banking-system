'use client';

import { updateCustomer } from '@/lib/actions/admin/customer';
import { AdminCustomerUpdateInput, AdminCustomerUpdateSchema } from '@/validation/admin';
import {
    Alert,
    Button,
    Group,
    LoadingOverlay,
    Select,
    Stack,
    TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';

interface CustomerModalProps {
  customer: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerModal({ customer, onClose, onSuccess }: CustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AdminCustomerUpdateInput>({
    initialValues: {
      firstName: customer?.firstName || '',
      lastName: customer?.lastName || '',
      phone: customer?.phone || '',
      status: customer?.status || 'ACTIVE',
    },
    validate: zod4Resolver(AdminCustomerUpdateSchema),
  });

  const handleSubmit = async (values: AdminCustomerUpdateInput) => {
    if (!customer) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await updateCustomer(customer.id, values);

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
      console.error('Error updating customer:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

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

        <Group grow>
          <TextInput
            label="First Name"
            placeholder="John"
            required
            {...form.getInputProps('firstName')}
            disabled={loading}
          />
          <TextInput
            label="Last Name"
            placeholder="Doe"
            required
            {...form.getInputProps('lastName')}
            disabled={loading}
          />
        </Group>

        <TextInput
          label="Email"
          value={customer?.email || ''}
          disabled
          readOnly
        />

        <TextInput
          label="Phone Number"
          placeholder="+1234567890"
          {...form.getInputProps('phone')}
          disabled={loading}
        />

        <Select
          label="Status"
          data={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'BANNED', label: 'Suspended' },
          ]}
          required
          {...form.getInputProps('status')}
          disabled={loading}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Update Customer
          </Button>
        </Group>
      </Stack>
    </form>
  );
}