import { Divider, Flex, MantineColor, Stack, Text, TextProps, ThemeIcon, ThemeIconVariant } from '@mantine/core';
import React, { ReactNode } from 'react';
import { textIcon } from '../../context/mantine/styles';

interface InfoIconProps {
    icon?: ReactNode;
    label?: ReactNode;
    children?: ReactNode;
    color?: MantineColor;
    action?: ReactNode;
    withDivider?: boolean;
    row?: boolean;
    variant?: ThemeIconVariant,
    labelProps?:TextProps
    valueProps?:TextProps
  
}

const InfoIcon: React.FC<InfoIconProps> = ({
    icon,
    label,
    children,
    color,
    action,
    withDivider = false,
    row,
    variant = "outline",
    labelProps,
    valueProps
}) => {
    return (
        <Stack gap={0}>
            <Flex justify="space-between" align="center">
                <Flex
                    direction={row ? 'row' : 'column'}
                    gap={5}
                    align={row ? 'center' : 'normal'}
                >
                    <Text style={textIcon} c={color} fz={{ base: 'sm', md: 'md' }} fw={500} {...labelProps}>
                        {icon &&
                            <ThemeIcon
                                variant={variant}
                                color={color}
                            >
                                {icon}
                            </ThemeIcon>
                        }
                        {label}
                    </Text>
                    {typeof children === 'string' || typeof children === 'number' ? (
                        <Text fz={{ base: 'xs', md: 'sm' }} fw={400} {...valueProps}>
                            {children}
                        </Text>
                    ) : (
                        children
                    )}
                </Flex>
                {action && action}
            </Flex>
            {withDivider && <Divider size="sm" mt={row ? 5 : 0} />}
        </Stack>
    );
};

export default InfoIcon;
