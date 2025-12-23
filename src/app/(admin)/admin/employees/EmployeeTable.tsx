'use client';

import { deleteEmployee, toggleEmployeeStatus } from '@/lib/actions/admin/employee';
import PATHS from '@/paths';
import { Employee, PaginationInfo } from '@/types/employee';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Flex,
    Group,
    LoadingOverlay,
    Menu,
    MenuDivider,
    MenuDropdown,
    MenuItem,
    MenuTarget,
    Modal,
    Pagination,
    Paper,
    Select,
    Table,
    Text,
    TextInput
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
    IconBan,
    IconCheck,
    IconDotsVertical,
    IconEdit,
    IconEye,
    IconFilter,
    IconSearch,
    IconTrash,
    IconUserPlus,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import EmployeeModal from './EmployeeModal';


interface EmployeeTableProps {
    initialData: {
        employees: Employee[];
        pagination: PaginationInfo;
    };
    searchParams: {
        search: string;
        role: string;
        status: string;
        page: number;
    };
}

export default function EmployeeTable({ initialData, searchParams }: EmployeeTableProps) {
    const router = useRouter();

    const [employees, setEmployees] = useState<Employee[]>(initialData.employees);
    const [pagination, setPagination] = useState<PaginationInfo>(initialData.pagination);
    const [loading, setLoading] = useState(false);

    // Modal states
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    // Filter states
    const [search, setSearch] = useState(searchParams.search);
    const [role, setRole] = useState<string>(searchParams.role);
    const [status, setStatus] = useState<string>(searchParams.status);
    const [page, setPage] = useState(searchParams.page);

    // Update employees when initialData changes
    useEffect(() => {
        setEmployees(initialData.employees);
        setPagination(initialData.pagination);
    }, [initialData]);

    // Update URL with filters
    const updateFilters = () => {
        const newParams = new URLSearchParams();
        if (search) newParams.set('search', search);
        if (role !== 'ALL') newParams.set('role', role);
        if (status !== 'ALL') newParams.set('status', status);
        if (page > 1) newParams.set('page', page.toString());

        router.push(`/admin/employees?${newParams.toString()}`);
    };

    // Handle filter changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
        }, 500);
        updateFilters();

        return () => clearTimeout(timeoutId);
    }, [search, role, status, page]);

    // Handle employee actions
    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;

        setLoading(true);
        const result = await deleteEmployee(id);

        if (result.success) {
            notifications.show({
                title: 'Success',
                message: result.message,
                color: 'green',
            });
            // Refresh data
            router.refresh();
        } else {
            notifications.show({
                title: 'Error',
                message: result.message,
                color: 'red',
            });
        }
        setLoading(false);
    };

    const handleToggleStatus = async (id: number) => {
        setLoading(true);
        const result = await toggleEmployeeStatus(id);

        if (result.success) {
            notifications.show({
                title: 'Success',
                message: result.message,
                color: 'green',
            });
            // Refresh data
            router.refresh();
        } else {
            notifications.show({
                title: 'Error',
                message: result.message,
                color: 'red',
            });
        }
        setLoading(false);
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        openModal();
    };

    const handleAdd = () => {
        setEditingEmployee(null);
        openModal();
    };

    const handleModalClose = () => {
        closeModal();
        setEditingEmployee(null);
    };

    // Format date
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <>
            <Box pos="relative">
                <LoadingOverlay visible={loading} />

                {/* Filters */}
                <Paper p="md" mb="md" withBorder>
                    <Group>
                        <TextInput
                            placeholder="Search by name, email, or phone"
                            leftSection={<IconSearch size={16} />}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <Select
                            placeholder="Role"
                            data={[
                                { value: 'ALL', label: 'All Roles' },
                                { value: 'TELLER', label: 'Teller' },
                                { value: 'MANAGER', label: 'Manager' },
                            ]}
                            value={role}
                            onChange={(value) => setRole(value || 'ALL')}
                            leftSection={<IconFilter size={16} />}
                        />
                        <Select
                            placeholder="Status"
                            data={[
                                { value: 'ALL', label: 'All Status' },
                                { value: 'ACTIVE', label: 'Active' },
                                { value: 'BANNED', label: 'Suspended' },
                            ]}
                            value={status}
                            onChange={(value) => setStatus(value || 'ALL')}
                            leftSection={<IconFilter size={16} />}
                        />
                        <Button
                            leftSection={<IconUserPlus size={16} />}
                            onClick={handleAdd}
                        >
                            Add Employee
                        </Button>
                    </Group>
                </Paper>

                {/* Table */}
                <Table.ScrollContainer minWidth={800}>
                    <Table verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Employee</Table.Th>
                                <Table.Th>Contact</Table.Th>
                                <Table.Th>Role</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Joined</Table.Th>
                                <Table.Th>Stats</Table.Th>
                                <Table.Th>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {employees.map((employee) => (
                                <Table.Tr key={employee.id}>
                                    <Table.Td>
                                        <div>
                                            <Text fw={500}>
                                                {employee.firstName} {employee.lastName}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                ID: {employee.id}
                                            </Text>
                                        </div>
                                    </Table.Td>
                                    <Table.Td>
                                        <div>
                                            <Text size="sm">{employee.email}</Text>
                                            {employee.phone && (
                                                <Text size="xs" c="dimmed">
                                                    {employee.phone}
                                                </Text>
                                            )}
                                        </div>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={employee.role === 'MANAGER' ? 'orange' : 'blue'}
                                            variant="light"
                                        >
                                            {employee.role}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={employee.status === 'ACTIVE' ? 'green' : 'red'}
                                            variant="light"
                                        >
                                            {employee.status}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm">{formatDate(employee.createdAt)}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4}>
                                            <Badge size="xs" variant="outline" title="Accounts">
                                                A: {employee._count.accounts}
                                            </Badge>
                                            <Badge size="xs" variant="outline" title="Transactions">
                                                T: {employee._count.transactions}
                                            </Badge>
                                            <Badge size="xs" variant="outline" title="Approvals">
                                                AP: {employee._count.approvals}
                                            </Badge>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap={4} wrap="nowrap">
                                            <ActionIcon
                                                variant="subtle"
                                                color="blue"
                                                onClick={() => handleEdit(employee)}
                                                title="Edit"
                                            >
                                                <IconEdit size={16} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="subtle"
                                                color={employee.status === 'ACTIVE' ? 'red' : 'green'}
                                                onClick={() => handleToggleStatus(employee.id)}
                                                title={employee.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                            >
                                                {employee.status === 'ACTIVE' ? (
                                                    <IconBan size={16} />
                                                ) : (
                                                    <IconCheck size={16} />
                                                )}
                                            </ActionIcon>
                                            <Menu position="bottom-end">
                                                <MenuTarget>
                                                    <ActionIcon variant="subtle">
                                                        <IconDotsVertical size={16} />
                                                    </ActionIcon>
                                                </MenuTarget>
                                                <MenuDropdown>
                                                    <MenuItem
                                                        leftSection={<IconEye size={14} />}
                                                        component={Link}
                                                        href={PATHS.admin.employee(employee.id)}
                                                    >
                                                        View Details
                                                    </MenuItem>
                                                    <MenuDivider />
                                                    <MenuItem
                                                        leftSection={<IconTrash size={14} />}
                                                        color="red"
                                                        onClick={() => handleDelete(employee.id)}
                                                    >
                                                        Delete
                                                    </MenuItem>
                                                </MenuDropdown>
                                            </Menu>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>

                {/* No results */}
                {employees.length === 0 && (
                    <Paper p="xl" mt="md" withBorder>
                        <Text ta="center" c="dimmed">
                            No employees found. Try adjusting your filters.
                        </Text>
                    </Paper>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <Flex justify="center" mt="xl">
                        <Pagination
                            value={page}
                            onChange={setPage}
                            total={pagination.totalPages}
                            siblings={1}
                            boundaries={1}
                        />
                    </Flex>
                )}

                {/* Pagination Info */}
                {employees.length > 0 && (
                    <Text size="sm" c="dimmed" ta="center" mt="md">
                        Showing {((page - 1) * pagination.pageSize) + 1} to{' '}
                        {Math.min(page * pagination.pageSize, pagination.total)} of{' '}
                        {pagination.total} employees
                    </Text>
                )}
            </Box>

            {/* Employee Modal */}
            <Modal
                opened={modalOpened}
                onClose={handleModalClose}
                title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                size="lg"
                centered
            >
                <EmployeeModal
                    employee={editingEmployee}
                    onClose={handleModalClose}
                    onSuccess={() => {
                        updateFilters();
                        handleModalClose();
                    }}
                />
            </Modal>
        </>
    );
}