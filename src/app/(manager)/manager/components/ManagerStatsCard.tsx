// app/dashboard/manager/components/ManagerStatsCard.tsx
import { Badge, Card, Center, Group, RingProgress, Text } from '@mantine/core';
import { IconProps } from '@tabler/icons-react';
import React from 'react';

interface ManagerStatsCardProps {
  title: string;
  value: number;
  icon: React.FC<IconProps>;
  color: string;
  description: string;
  isCurrency?: boolean;
  trend?: 'high' | 'low' | 'stable';
}

export default function ManagerStatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  description,
  isCurrency = false,
  trend 
}: ManagerStatsCardProps) {
  
  const formatValue = (val: number) => {
    if (isCurrency) {
      return `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return val.toLocaleString();
  };

  return (
    <Card withBorder shadow="sm" radius="md">
      <Group justify="space-between">
        <div style={{ flex: 1 }}>
          <Group justify="space-between" mb={4}>
            <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
              {title}
            </Text>
            {trend && (
              <Badge 
                size="xs" 
                color={
                  trend === 'high' ? 'red' :
                  trend === 'low' ? 'green' : 'gray'
                }
                variant="light"
              >
                {trend}
              </Badge>
            )}
          </Group>
          <Text fw={700} size="xl">
            {formatValue(value)}
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