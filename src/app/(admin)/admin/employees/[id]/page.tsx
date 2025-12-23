import { getEmployeeById } from '@/lib/actions/admin/employee';
import { requireRole } from '@/lib/auth';
import PATHS from '@/paths';
import {
    Anchor,
    Badge,
    Breadcrumbs,
    Button,
    Card,
    Container,
    Grid,
    GridCol,
    Group,
    Paper,
    Stack,
    Table,
    TableTbody,
    TableTd,
    TableTh,
    TableThead,
    TableTr,
    Text,
    Title,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconCalendar,
    IconChecklist,
    IconMail,
    IconPhone,
    IconReceipt,
    IconUser,
    IconWallet,
} from '@tabler/icons-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EmployeeDetailsPage({ params }: PageProps) {
    const { id } = await params;

    // Check if user is admin
    try {
        await requireRole(['ADMIN']);
    } catch {
        redirect('/auth/login');
    }

    // Get employee details
    const result = await getEmployeeById(parseInt(id));

    if (!result.success) {
        redirect('/admin/employees');
    }

    const employee = result.data?.employee;

    // Format date
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (employee) {
        return (
            <Container size="xl" py="xl">
                {/* Breadcrumbs */}
                <Breadcrumbs mb="md">
                    <Anchor component={Link} href={PATHS.admin.index} size="sm">
                        Admin
                    </Anchor>
                    <Anchor component={Link} href={PATHS.admin.employees} size="sm">
                        Employees
                    </Anchor>
                    <Text size="sm" c="dimmed">
                        {employee.firstName} {employee.lastName}
                    </Text>
                </Breadcrumbs>

                {/* Back Button */}
                <Button
                    component={Link}
                    href={PATHS.admin.employees}
                    variant="light"
                    leftSection={<IconArrowLeft size={16} />}
                    mb="xl"
                >
                    Back to Employees
                </Button>

                {/* Header */}
                <Group justify="space-between" mb="xl">
                    <Group>
                        <IconUser size={32} />
                        <div>
                            <Title order={1}>
                                {employee.firstName} {employee.lastName}
                            </Title>
                            <Text c="dimmed">Employee Details</Text>
                        </div>
                    </Group>
                    <Group>
                        <Badge
                            size="lg"
                            color={employee.role === 'MANAGER' ? 'orange' : 'blue'}
                        >
                            {employee.role}
                        </Badge>
                        <Badge
                            size="lg"
                            color={employee.status === 'ACTIVE' ? 'green' : 'red'}
                        >
                            {employee.status}
                        </Badge>
                    </Group>
                </Group>

                {/* Main Content */}
                <Grid>
                    {/* Left Column - Personal Info */}
                    <GridCol span={{ base: 12, lg: 4 }}>
                        <Stack>
                            {/* Personal Info Card */}
                            <Card withBorder shadow="sm" radius="md">
                                <Title order={3} mb="md">Personal Information</Title>
                                <Stack gap="md">
                                    <InfoItem
                                        icon={<IconMail size={20} />}
                                        label="Email"
                                        value={employee.email}
                                    />
                                    <InfoItem
                                        icon={<IconPhone size={20} />}
                                        label="Phone"
                                        value={employee.phone || 'Not provided'}
                                    />
                                    <InfoItem
                                        icon={<IconCalendar size={20} />}
                                        label="Joined"
                                        value={formatDate(employee.createdAt)}
                                    />
                                    <InfoItem
                                        icon={<IconCalendar size={20} />}
                                        label="Last Updated"
                                        value={formatDate(employee.updatedAt)}
                                    />
                                </Stack>
                            </Card>

                            {/* Quick Actions Card */}
                            <Card withBorder shadow="sm" radius="md">
                                <Title order={3} mb="md">Quick Actions</Title>
                                <Stack gap="sm">
                                    <Button
                                        component={Link}
                                        href={`/admin/employees?edit=${employee.id}`}
                                        variant="light"
                                        fullWidth
                                    >
                                        Edit Employee
                                    </Button>
                                    <Button
                                        variant="light"
                                        color={employee.status === 'ACTIVE' ? 'red' : 'green'}
                                        fullWidth
                                    >
                                        {employee.status === 'ACTIVE' ? 'Suspend Employee' : 'Activate Employee'}
                                    </Button>
                                    <Button
                                        variant="light"
                                        color="red"
                                        fullWidth
                                    >
                                        Reset Password
                                    </Button>
                                </Stack>
                            </Card>
                        </Stack>
                    </GridCol>

                    {/* Right Column - Activity & Stats */}
                    <GridCol span={{ base: 12, lg: 8 }}>
                        <Stack>
                            {/* Stats Cards */}
                            <Grid>
                                <GridCol span={{ base: 12, sm: 6, md: 3 }}>
                                    <StatCard
                                        icon={<IconWallet size={24} />}
                                        label="Managed Accounts"
                                        value="0" // You would fetch this from database
                                        color="blue"
                                    />
                                </GridCol>
                                <GridCol span={{ base: 12, sm: 6, md: 3 }}>
                                    <StatCard
                                        icon={<IconReceipt size={24} />}
                                        label="Transactions"
                                        value="0" // You would fetch this from database
                                        color="green"
                                    />
                                </GridCol>
                                <GridCol span={{ base: 12, sm: 6, md: 3 }}>
                                    <StatCard
                                        icon={<IconChecklist size={24} />}
                                        label="Approvals"
                                        value="0" // You would fetch this from database
                                        color="orange"
                                    />
                                </GridCol>
                                <GridCol span={{ base: 12, sm: 6, md: 3 }}>
                                    <StatCard
                                        icon={<IconUser size={24} />}
                                        label="Active Since"
                                        value={new Date(employee.createdAt).getFullYear().toString()}
                                        color="violet"
                                    />
                                </GridCol>
                            </Grid>

                            {/* Recent Activity Card */}
                            <Card withBorder shadow="sm" radius="md">
                                <Title order={3} mb="md">Recent Activity</Title>
                                <Paper p="md" withBorder>
                                    <Text c="dimmed" ta="center">
                                        Activity logs will appear here once the employee starts working.
                                    </Text>
                                </Paper>
                            </Card>

                            {/* System Access Card */}
                            <Card withBorder shadow="sm" radius="md">
                                <Title order={3} mb="md">System Access</Title>
                                <Table>
                                    <TableThead>
                                        <TableTr>
                                            <TableTh>Permission</TableTh>
                                            <TableTh>Access Level</TableTh>
                                            <TableTh>Last Accessed</TableTh>
                                        </TableTr>
                                    </TableThead>
                                    <TableTbody>
                                        <TableTr>
                                            <TableTd>Customer Management</TableTd>
                                            <TableTd>
                                                <Badge color="green">Full Access</Badge>
                                            </TableTd>
                                            <TableTd>{formatDate(new Date())}</TableTd>
                                        </TableTr>
                                        <TableTr>
                                            <TableTd>Account Operations</TableTd>
                                            <TableTd>
                                                <Badge color={employee.role === 'MANAGER' ? 'green' : 'yellow'}>
                                                    {employee.role === 'MANAGER' ? 'Full Access' : 'Limited'}
                                                </Badge>
                                            </TableTd>
                                            <TableTd>{formatDate(new Date())}</TableTd>
                                        </TableTr>
                                        <TableTr>
                                            <TableTd>Transaction Approval</TableTd>
                                            <TableTd>
                                                <Badge color={employee.role === 'MANAGER' ? 'green' : 'yellow'}>
                                                    {employee.role === 'MANAGER' ? 'Full Access' : 'Up to $5,000'}
                                                </Badge>
                                            </TableTd>
                                            <TableTd>{formatDate(new Date())}</TableTd>
                                        </TableTr>
                                        <TableTr>
                                            <TableTd>Reports</TableTd>
                                            <TableTd>
                                                <Badge color={employee.role === 'MANAGER' ? 'green' : 'red'}>
                                                    {employee.role === 'MANAGER' ? 'View Only' : 'No Access'}
                                                </Badge>
                                            </TableTd>
                                            <TableTd>-</TableTd>
                                        </TableTr>
                                    </TableTbody>
                                </Table>
                            </Card>
                        </Stack>
                    </GridCol>
                </Grid>
            </Container>
        );
    } else {
        return <>sss</>
    }

}

// Helper Components
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Group>
            {icon}
            <div>
                <Text size="sm" c="dimmed">{label}</Text>
                <Text fw={500}>{value}</Text>
            </div>
        </Group>
    );
}

function StatCard({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <Card withBorder>
            <Stack align="center" gap="xs">
                <div style={{ color }}>
                    {icon}
                </div>
                <Text size="xl" fw={700}>
                    {value}
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                    {label}
                </Text>
            </Stack>
        </Card>
    );
}