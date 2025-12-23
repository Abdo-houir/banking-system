import { getEmployees } from '@/lib/actions/admin/employee';
import { requireRole } from '@/lib/auth';
import {
    Anchor,
    Breadcrumbs,
    Container,
    Group,
    Paper,
    Stack,
    Text,
    Title
} from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import EmployeeTable from './EmployeeTable';

interface PageProps {
    searchParams?: {
        search?: string;
        role?: string;
        status?: string;
        page?: string;
    };
}

export default async function EmployeesPage({ searchParams }: PageProps) {
    // Check if user is admin
    try {
        await requireRole(['ADMIN']);
    } catch {
        redirect('/auth/login');
    }


    // Parse search params
    const search = searchParams?.search || '';
    const role = searchParams?.role as 'TELLER' | 'MANAGER' | 'ALL' || 'ALL';
    const status = searchParams?.status as 'ACTIVE' | 'BANNED' | 'ALL' || 'ALL';
    const page = parseInt(searchParams?.page || '1');

    // Fetch employees
    const result = await getEmployees({
        search,
        role,
        status,
        page,
        pageSize: 5,
    });

    // Default empty data structure
    const defaultData = {
        employees: [],
        pagination: {
            total: 0,
            page: 1,
            pageSize: 5,
            totalPages: 0,
        },
    };

    return (
        <Container size="xl" py="xl">
            {/* Breadcrumbs */}
            <Breadcrumbs mb="md">
                <Anchor component={Link} href="/admin" size="sm">
                    Admin
                </Anchor>
                <Text size="sm" c="dimmed">
                    Employees
                </Text>
            </Breadcrumbs>

            {/* Page Header */}
            <Group justify="space-between" mb="xl">
                <div>
                    <Group gap="sm">
                        <IconUsers size={32} />
                        <div>
                            <Title order={1}>Employee Management</Title>
                            <Text c="dimmed">
                                Manage tellers and managers in the banking system
                            </Text>
                        </div>
                    </Group>
                </div>
            </Group>

            {/* Main Content */}
            <Paper shadow="sm" p="md" radius="md" withBorder>
                <Stack gap="md">
                    <EmployeeTable
                        initialData={result.success && result.data ? result.data : defaultData}
                        searchParams={{ search, role, status, page }}
                    />
                </Stack>
            </Paper>
        </Container>
    );
}