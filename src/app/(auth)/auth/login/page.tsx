"use client";

import { useApi } from '@/hooks/useApi';
import PATHS from '@/paths';
import { endpoints } from '@/types/api';
import { LoginResponseData } from '@/types/auth';
import { LoginInput, loginSchema } from '@/validation/auth';
import {
    Anchor,
    Box,
    Button,
    Group,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Title
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BiSolidErrorAlt } from "react-icons/bi";

export default function LoginPage() {
    const { replace } = useRouter()
    // Initialize form with validation
    const form = useForm<LoginInput>({
        initialValues: {
            email: '',
            password: '',
        },
        validate: zod4Resolver(loginSchema),
    });

    // Use type-safe API hook
    const { callApi, loading, errors } = useApi<LoginResponseData>();

    // Map API errors to form errors
    useEffect(() => {
        if (errors && errors.length > 0) {
            errors.forEach((err) => {
                if (err.field) {
                    form.setFieldError(err.field, err.message);
                }
            });
        }
    }, [errors, form]);

    const handleSubmit = async (values: LoginInput) => {
        const result = await callApi(endpoints.auth.login, {
            method: 'POST',
            body: JSON.stringify(values),
        });

        if (result.success && result.data) {
            // Show success notification
            notifications.show({
                title: 'Success!',
                message: 'You have been logged in successfully',
                color: 'green',
                icon: <IconCheck size={18} />,
                position: "top-right"
            });

            switch (result.data.user.role) {
                case "ADMIN":
                    replace(PATHS.admin.index);
                    break;
                case "CUSTOMER":
                    replace(PATHS.customer.index);
                    break;
                case "TELLER":
                    replace(PATHS.teller.index);
                    break;
                case "MANAGER":
                    replace(PATHS.manager.index);
                    break;
                default:
                    break;
            }
            // Redirect to dashboard
        } else if (!result.success) {
            // General error is already set by the hook
            console.log('Login failed:', result.error);

            notifications.show({
                title: 'Error!',
                message: result.error,
                color: 'red',
                icon: <BiSolidErrorAlt size={18} />,
                position: "top-right"
            });
        }
    };

    return (
        <Stack gap={0}>
            <Title ta="center" fw={900} c="emerald">
                Welcome back!
            </Title>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <TextInput
                    label="Email"
                    placeholder="you@example.com"
                    required
                    {...form.getInputProps('email')}
                    disabled={loading}
                    error={form.errors.email}
                />

                <PasswordInput
                    label="Password"
                    placeholder="Your password"
                    required
                    mt="md"
                    {...form.getInputProps('password')}
                    disabled={loading}
                    error={form.errors.password}
                />

                <Group justify="space-between" mt="lg">
                    <Anchor component="button" type="button" size="sm" c="dimmed">
                        Forgot password?
                    </Anchor>
                </Group>

                <Button
                    fullWidth
                    mt="xl"
                    type="submit"
                    loading={loading}
                    disabled={loading}
                >
                    Sign in
                </Button>
            </form>
            <Text c="dimmed" size="sm" ta="center" mt={5}>
                Do not have an account yet?{' '}
                <Anchor href={PATHS.auth.register} size="sm">
                    Create account
                </Anchor>
            </Text>
            {/* Demo credentials for testing */}
            <Box mt="xl" p="md" bg="gray.0" style={{ borderRadius: '8px' }}>
                <Text size="sm" fw={500} mb="xs">
                    Demo Credentials:
                </Text>
                <Text size="xs" c="dimmed">
                    Admin: admin@bank.com / admin123
                </Text>
                <Text size="xs" c="dimmed">
                    Teller: teller@bank.com / teller123
                </Text>
            </Box>
        </Stack>
    );
}