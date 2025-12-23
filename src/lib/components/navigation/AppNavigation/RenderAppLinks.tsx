"use client"
import { List, Menu, NavLink, NavLinkProps } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { textIcon } from "../../../context/mantine/styles";

type Props = {
    items: LinkType[],
    invertIcon?: boolean;
    navLinkProps?: NavLinkProps;
}

const RenderAppLinks = ({ items, invertIcon, navLinkProps }: Props) => {
    const pathname = usePathname();



    const renderLinks = (items: LinkType[], full: boolean): ReactNode =>
        items.map((link) => {
            const isActive = (pathname === link.href) || (window.location.hash === link.href);

            if (link.children?.length && !full) {
                return (
                    <Menu key={link.href} withArrow shadow="md" trigger="click">
                        <Menu.Target>
                            <NavLink
                                key={link.href}
                                label={link.label}
                                leftSection={!invertIcon ? link.icon : undefined}
                                rightSection={invertIcon ? link.icon : undefined}
                                // childrenOffset={28}
                                active={isActive}
                                {...navLinkProps}
                            >
                                <div style={{ display: "none" }}></div>
                            </NavLink>
                        </Menu.Target>
                        <Menu.Dropdown >
                            <Menu.Label style={textIcon}>
                                {link.icon}
                                {link.label}
                            </Menu.Label>
                            <Menu.Divider />
                            <List >
                                {renderLinks(link.children, true)}
                            </List>
                        </Menu.Dropdown>
                    </Menu>
                )
            }

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
                        {renderLinks(link.children, true)}
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

    return renderLinks(items, false);

}

export default RenderAppLinks