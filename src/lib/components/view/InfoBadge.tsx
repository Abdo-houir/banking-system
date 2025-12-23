import { Badge, BadgeProps, MantineColor, Stack, Text, TextProps } from '@mantine/core';
import React, { ReactNode } from 'react';
import { textIcon } from '../../context/mantine/styles';

interface InfoBadgeProps {
  color?: MantineColor;
  icon?: ReactNode;
  label?: ReactNode;
  children?: ReactNode;
  variant?: BadgeProps['variant']; // ensures you can only use Mantine variants like "dot" | "filled" | "outline"
  labelProps?:TextProps
  badgeProps?:BadgeProps
}

const InfoBadge: React.FC<InfoBadgeProps> = ({
  color,
  icon,
  label,
  children,
  variant = 'dot',
  badgeProps,
  labelProps,
}) => {
  return (
    <Stack align="center" gap={0}>
      <Text style={textIcon} c={color} fz={{ base: 'sm', md: 'md' }} {...labelProps}>
        {icon && icon}
        {label}
      </Text>
      <Badge
        variant={variant}
        color={color}
        w="100%"
        fz={{ base: 'xs', md: 'sm' }}
        size="md"
        {...badgeProps}
      >
        {children}
      </Badge>
    </Stack>
  );
};

export default InfoBadge;
