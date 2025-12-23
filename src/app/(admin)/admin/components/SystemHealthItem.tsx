
import { Badge, Group, Text } from "@mantine/core";

function SystemHealthItem({ label, status }: { label: string; status: 'healthy' | 'warning' | 'error' }) {
    const colors = {
        healthy: 'green',
        warning: 'yellow',
        error: 'red',
    };

    return (
        <Group justify="space-between">
            <Text size="sm">{label}</Text>
            <Badge color={colors[status]} variant="light">
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        </Group>
    );
}

export default SystemHealthItem