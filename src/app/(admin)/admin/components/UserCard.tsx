import { Badge, Group, Paper, Text } from "@mantine/core";

function UserCard({ user }: {
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        status: string;
        createdAt: Date;
    }
}) {
    const roleColors = {
        ADMIN: 'red',
        MANAGER: 'orange',
        TELLER: 'blue',
        CUSTOMER: 'green',
    } as const;

    return (
        <Paper p="xs" withBorder>
            <Group justify="space-between">
                <div>
                    <Text size="sm" fw={500}>
                        {user.firstName} {user.lastName}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {user.email}
                    </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <Badge
                        size="xs"
                        color={roleColors[user.role as keyof typeof roleColors] || 'gray'}
                    >
                        {user.role}
                    </Badge>
                    <Text size="xs" c="dimmed" mt={4}>
                        {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                </div>
            </Group>
        </Paper>
    );
}

export default UserCard