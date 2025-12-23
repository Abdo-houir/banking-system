// app/dashboard/teller/components/TellerStatsCard.tsx
import { Card, Center, Group, RingProgress, Text } from '@mantine/core';
import { IconProps } from '@tabler/icons-react';
import React from 'react';

interface TellerStatsCardProps {
  title: string;
  value: number;
  icon: React.FC<IconProps>;
  color: string;
  description: string;
}

export default function TellerStatsCard({ title, value, icon: Icon, color, description }: TellerStatsCardProps) {
  return (
    <Card withBorder shadow="sm" radius="md">
      <Group justify="space-between">
        <div>
          <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
          <Text size="xs" c="dimmed" mt={7}>
            {description}
          </Text>
        </div>
        <RingProgress
          size={80}
          thickness={8}
          sections={[{ value: 100, color }]}
          label={
            <Center>
              <Icon size={24} color={`var(--mantine-color-${color}-6)`} />
            </Center>
          }
        />
      </Group>
    </Card>
  );
}