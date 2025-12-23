import { ActionIcon, Menu, MenuDropdown, MenuProps, MenuTarget, NavLinkProps } from '@mantine/core'
import { RiMenu2Fill } from 'react-icons/ri'
import RenderSidebarLinks from '../SidebarNavigation/RenderSidebarLinks'

type Props = {
    links: LinkType[],
    navLinkProps?: NavLinkProps | undefined
    containerProps?: MenuProps | undefined
}

const MenuNavigation = ({ links, navLinkProps, containerProps }: Props) => {
    return (
        <Menu
            withArrow
            floatingStrategy='fixed'
            position='bottom'
            offset={{
                mainAxis: 15,
            }}
            {...containerProps}
        >
            <MenuTarget>
                <ActionIcon
                    variant='light'
                    c="var(--mantine-color-text)"
                >
                    <RiMenu2Fill />
                </ActionIcon>
            </MenuTarget>
            <MenuDropdown >
                <RenderSidebarLinks
                    items={links}
                    full
                    navLinkProps={navLinkProps}
                />
            </MenuDropdown>
        </Menu>
    )
}

export default MenuNavigation