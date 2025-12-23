"use client";

import { List, NavLink, NavLinkProps, Popover, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

type Props = {
    items: LinkType[],
    isIconOnlyProp?: string,
    invertIcon?: boolean;
    navLinkProps?: NavLinkProps;
    full: boolean
}

const RenderSidebarLinks = ({ items, isIconOnlyProp, invertIcon, navLinkProps, full = false }: Props) => {
    const pathname = usePathname();
    const isIconOnly = useMediaQuery(isIconOnlyProp || "none");

    const renderLinks = (items: LinkType[], full: boolean = false): ReactNode =>
        items.map((link) => {
            const isActive = pathname === link.href;

            // ✅ Collapsed sidebar (icon-only)
            if (isIconOnly && !full) {
                // if link has children → use Popover to show submenu
                if (link.children?.length) {
                    return (
                        <Popover key={link.href} position="right-start" withArrow shadow="md">
                            <Popover.Target>
                                <Tooltip label={link.label}>
                                    <NavLink
                                        label={link.icon}
                                        active={isActive}
                                        {...navLinkProps}
                                    />
                                </Tooltip>
                            </Popover.Target>
                            <Popover.Dropdown p={4}>
                                <List >
                                    {renderLinks(link.children, true)}
                                </List>
                            </Popover.Dropdown>
                        </Popover>
                    );
                }

                // simple link → tooltip only
                return (
                    <Tooltip label={link.label} key={link.href}>
                        <NavLink
                            component={Link}
                            href={link.href}
                            label={link.icon}
                            active={isActive}
                            {...navLinkProps}
                        />
                    </Tooltip>
                );
            }
            // ✅ Expanded sidebar
            if (link.children?.length) {
                return (
                    <NavLink
                        key={link.href}
                        label={link.label}
                        leftSection={!invertIcon ? link.icon : undefined}
                        rightSection={invertIcon ? link.icon : undefined}
                        // childrenOffset={28}
                        active={isActive}
                        {...navLinkProps}
                    >
                        {/* <Divider mb={2}/> */}
                        {renderLinks(link.children, full)}
                        {/* <Divider mt={2}/> */}
                    </NavLink>
                );
            }

            // ✅ Regular item
            return (
                <NavLink
                    key={link.href}
                    component={Link}
                    href={link.href}
                    label={link.label}
                    leftSection={!invertIcon ? link.icon : undefined}
                    rightSection={invertIcon ? link.icon : undefined}
                    active={isActive}
                    {...navLinkProps}
                />
            );
        });

    return renderLinks(items, full);
}

export default RenderSidebarLinks