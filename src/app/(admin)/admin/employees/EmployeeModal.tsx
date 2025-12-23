'use client';

import { createEmployee, updateEmployee } from '@/lib/actions/admin/employee';
import { Employee } from '@/types/employee';
import { EmployeeInput, employeeSchema } from '@/validation/admin';
import {
    Alert,
    Button,
    Group,
    LoadingOverlay,
    PasswordInput,
    Select,
    Stack,
    TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';

interface EmployeeModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmployeeModal({ employee, onClose, onSuccess }: EmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EmployeeInput>({
    initialValues: {
      email: employee?.email || '',
      password: '',
      firstName: employee?.firstName || '',
      lastName: employee?.lastName || '',
      phone: employee?.phone || '',
      role: employee?.role as "TELLER" | "MANAGER" || 'TELLER',
      status: employee?.status || 'ACTIVE',
    },
    validate: zod4Resolver(employeeSchema),
    transformValues: (values) => ({
      ...values,
      // If editing and password is empty, remove it (keep existing)
      password: employee && !values.password ? undefined : values.password,
    }),
  });

  const handleSubmit = async (values: EmployeeInput) => {
    setLoading(true);
    setError(null);

    try {
      let result;

      if (employee) {
        // Update existing employee
        result = await updateEmployee(employee.id, values);
      } else {
        // Create new employee
        result = await createEmployee(values);
      }

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
          setError(result.message || 'Operation failed');
        }
      }
    } catch (err) {
      console.error('Error saving employee:', err);
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
          placeholder="employee@bank.com"
          required
          {...form.getInputProps('email')}
          disabled={loading || !!employee}
        />

        <PasswordInput
          label={employee ? 'New Password (leave empty to keep current)' : 'Password'}
          placeholder="Enter password"
          required={!employee}
          {...form.getInputProps('password')}
          disabled={loading}
        />

        <TextInput
          label="Phone Number"
          placeholder="+1234567890"
          {...form.getInputProps('phone')}
          disabled={loading}
        />

        <Group grow>
          <Select
            label="Role"
            data={[
              { value: 'TELLER', label: 'Teller' },
              { value: 'MANAGER', label: 'Manager' },
            ]}
            required
            {...form.getInputProps('role')}
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
        </Group>

        {employee && (
          <Alert color="blue" variant="light">
            Leave password field empty to keep the current password.
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {employee ? 'Update Employee' : 'Create Employee'}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}