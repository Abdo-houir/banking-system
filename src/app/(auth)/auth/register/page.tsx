"use client";
import { z } from 'zod';

import { useApi } from '@/hooks/useApi';
import PATHS from '@/paths';
import { endpoints } from '@/types/api';
import { RegisterResponseData } from '@/types/auth';
import { registerSchema } from '@/validation/auth';
import {
    Alert,
    Anchor,
    Box,
    Button,
    Grid,
    Group,
    LoadingOverlay,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Title
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconLock, IconMail, IconPhone, IconUser } from '@tabler/icons-react';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BiSolidErrorAlt } from "react-icons/bi";

const registerFormSchema = registerSchema.extend({
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterFormInput = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
    const router = useRouter();
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Initialize form with validation
    const form = useForm<RegisterFormInput>({
        initialValues: {
            email: '',
            password: '',
            firstName: '',
            confirmPassword: "",
            lastName: '',
            phone: '',
        },
        validate: zod4Resolver(registerFormSchema),
        validateInputOnBlur: true,
    });

    // Use type-safe API hook
    const { callApi, loading, errors } = useApi<RegisterResponseData>();

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

    // Password strength calculator
    const calculatePasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[a-z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        return strength;
    };

    // Update password strength when password changes
    useEffect(() => {
        setPasswordStrength(calculatePasswordStrength(form.values.password));
    }, [form.values.password]);

    const handleSubmit = async (values: RegisterFormInput) => {
        // Remove confirmPassword before sending to API
        const { confirmPassword, ...submitData } = values;

        const result = await callApi(endpoints.auth.register, {
            method: 'POST',
            body: JSON.stringify(submitData),
        });

        if (result.success && result.data) {
            // Show success notification
            notifications.show({
                title: 'Registration Successful!',
                message: 'Your account has been created successfully. Redirecting to login...',
                color: 'green',
                icon: <IconCheck size={18} />,
                position: "top-right",
                autoClose: 3000,
            });

            // Redirect to login page after 2 seconds
            setTimeout(() => {
                router.push(PATHS.auth.login);
            }, 2000);

        } else if (!result.success) {
            // Show error notification
            notifications.show({
                title: 'Registration Failed',
                message: result.error || 'An error occurred during registration',
                color: 'red',
                icon: <BiSolidErrorAlt size={18} />,
                position: "top-right",
            });
        }
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength >= 75) return 'green';
        if (passwordStrength >= 50) return 'yellow';
        if (passwordStrength >= 25) return 'orange';
        return 'red';
    };

    return (
        <Stack gap="md">
            <LoadingOverlay visible={loading} zIndex={1000} />

            <Title ta="center" fw={900} c="emerald">
                Create Account
            </Title>

            <Text c="dimmed" size="sm" ta="center">
                Join our banking community and enjoy secure financial services
            </Text>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Grid gutter="md">
                    {/* Personal Information */}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                            label="First Name"
                            placeholder="John"
                            leftSection={<IconUser size={16} />}
                            {...form.getInputProps('firstName')}
                            disabled={loading}
                            error={form.errors.firstName}
                            description="Enter your legal first name"
                        />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                            label="Last Name"
                            placeholder="Doe"
                            leftSection={<IconUser size={16} />}
                            {...form.getInputProps('lastName')}
                            disabled={loading}
                            error={form.errors.lastName}
                            description="Enter your legal last name"
                        />
                    </Grid.Col>

                    {/* Contact Information */}
                    <Grid.Col span={12}>
                        <TextInput
                            label="Email Address"
                            placeholder="you@example.com"
                            type="email"
                            leftSection={<IconMail size={16} />}
                            {...form.getInputProps('email')}
                            disabled={loading}
                            error={form.errors.email}
                            description="We'll send verification and important notices to this email"
                        />
                    </Grid.Col>

                    <Grid.Col span={12}>
                        <TextInput
                            label="Phone Number (Optional)"
                            placeholder="+1234567890"
                            leftSection={<IconPhone size={16} />}
                            {...form.getInputProps('phone')}
                            disabled={loading}
                            error={form.errors.phone}
                            description="Include country code (e.g., +1 for USA)"
                        />
                    </Grid.Col>

                    {/* Password Section */}
                    <Grid.Col span={{ base: 12, md: 12 }}>
                        <PasswordInput
                            label="Password"
                            placeholder="Create a strong password"
                            leftSection={<IconLock size={16} />}
                            {...form.getInputProps('password')}
                            disabled={loading}
                            error={form.errors.password}
                            description="Minimum 8 characters with uppercase, lowercase, and number"
                        />

                        {/* Password Strength Meter */}
                        {form.values.password && (
                            <Box mt="xs">
                                <Text size="xs" c="dimmed">Password Strength</Text>
                                <Group gap={4} mt={2}>
                                    <Box
                                        style={{
                                            height: 4,
                                            flex: 1,
                                            backgroundColor: getPasswordStrengthColor(),
                                            borderRadius: 2,
                                            opacity: passwordStrength >= 25 ? 1 : 0.3
                                        }}
                                    />
                                    <Box
                                        style={{
                                            height: 4,
                                            flex: 1,
                                            backgroundColor: getPasswordStrengthColor(),
                                            borderRadius: 2,
                                            opacity: passwordStrength >= 50 ? 1 : 0.3
                                        }}
                                    />
                                    <Box
                                        style={{
                                            height: 4,
                                            flex: 1,
                                            backgroundColor: getPasswordStrengthColor(),
                                            borderRadius: 2,
                                            opacity: passwordStrength >= 75 ? 1 : 0.3
                                        }}
                                    />
                                    <Box
                                        style={{
                                            height: 4,
                                            flex: 1,
                                            backgroundColor: getPasswordStrengthColor(),
                                            borderRadius: 2,
                                            opacity: passwordStrength >= 100 ? 1 : 0.3
                                        }}
                                    />
                                </Group>
                                <Text size="xs" c={getPasswordStrengthColor()} mt={2}>
                                    {passwordStrength >= 75 ? 'Strong' :
                                        passwordStrength >= 50 ? 'Moderate' :
                                            passwordStrength >= 25 ? 'Weak' : 'Very Weak'}
                                </Text>
                            </Box>
                        )}
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, md: 12 }}>
                        <PasswordInput
                            label="Confirm Password"
                            placeholder="Re-enter your password"
                            leftSection={<IconLock size={16} />}
                            {...form.getInputProps('confirmPassword')}
                            disabled={loading}
                            error={form.errors.confirmPassword}
                            description="Must match the password above"
                        />
                    </Grid.Col>
                </Grid>

                <Button
                    fullWidth
                    mt="xl"
                    size="md"
                    type="submit"
                    loading={loading}
                    disabled={loading}
                >
                    Create Account
                </Button>
            </form>

            <Group justify="center" mt="md">
                <Text c="dimmed" size="sm">
                    Already have an account?{' '}
                    <Anchor href={PATHS.auth.login} size="sm" fw={500}>
                        Sign in
                    </Anchor>
                </Text>
            </Group>

            {/* Demo Information */}
            <Alert title="Demo Information" color="yellow" variant="light" mt="lg">
                <Text size="sm">
                    This is a demo banking application. Real banking features are simulated.
                </Text>
                <Text size="xs" mt={4}>
                    • All data is stored locally for demonstration purposes
                    • No real financial transactions can be performed
                    • Use demo credentials to explore different roles
                </Text>
            </Alert>
        </Stack>
    );
}