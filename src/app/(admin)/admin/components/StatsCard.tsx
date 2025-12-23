import { Badge, Card, Group, Text, Title } from "@mantine/core";

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  description,
  trend
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  description: string;
  trend: number;
}) {
  return (
    <Card withBorder shadow="sm" radius="md">
      <Group>
        <Icon size={40} color={color} />
        <div>
          <Text size="sm" c="dimmed">{title}</Text>
          <Title order={3}>{value.toLocaleString()}</Title>
        </div>
      </Group>
      <Group justify="space-between" mt="md">
        <Text size="xs" c="dimmed">{description}</Text>
        <Badge color={trend > 0 ? 'green' : 'red'}>
          {trend > 0 ? '+' : ''}{trend}%
        </Badge>
      </Group>
    </Card>
  );
}

export default StatsCard