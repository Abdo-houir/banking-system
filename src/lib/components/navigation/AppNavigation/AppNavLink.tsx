"use client"
import { Button, Menu, MenuDropdown, MenuItem, MenuLabel, MenuTarget } from '@mantine/core';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FC } from 'react';
import { textIcon } from '../../../context/mantine/styles';

type NavLinkProps = {
    link: LinkType
    className?: string; // Additional class names
    includes?: boolean
}

const AppNavLink: FC<NavLinkProps> = ({ link, className, includes }) => {
    const pathname = usePathname();
    const isActive = includes
        ? pathname.includes(link.href) || link.href === window.location.hash
        : (pathname === link.href) || (window.location.hash === link.href);
    ;

    if (!!link.children) {
        return (
            <Menu >
                <MenuTarget>
                    <Button
                        color={"var(--mantine-primary-color-5)"}
                        variant={isActive ? "subtle" : "subtle"}
                        c={isActive ? "var(--mantine-primary-color-5)" : "var(--mantine-color-text)"}
                        size='sm'
                        className={className}
                        miw="fit-content"
                        leftSection={!!link.icon && link.icon}
                    >
                        {link.label}
                    </Button>
                </MenuTarget>
                <MenuDropdown>
                    <MenuLabel style={textIcon}>
                        {link.icon}
                        {link.label}
                    </MenuLabel>
                    {
                        link.children.map(subLink => (
                            <MenuItem
                                key={subLink.href}
                                leftSection={subLink.icon}
                                component={Link}
                                href={subLink.href}
                                c={isActive ? "var(--mantine-primary-color-5)" : "var(--mantine-color-text)"}
                            >
                                {subLink.label}
                            </MenuItem>
                        ))
                    }
                </MenuDropdown>
            </Menu>
        )
    } else {
        return (
            <Link href={link.href}>
                <Button
                    color={"var(--mantine-primary-color-5)"}
                    variant={isActive ? "subtle" : "subtle"}
                    c={isActive ? "var(--mantine-primary-color-5)" : "var(--mantine-color-text)"}
                    size='sm'
                    className={className}
                    leftSection={!!link.icon && link.icon}
                >
                    {link.label}
                </Button>
            </Link>
        );
    }

};

export default AppNavLink;
