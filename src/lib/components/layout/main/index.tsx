import { questLinks } from '@/config-nav';
import PATHS from '@/paths';
import { AppShell, AppShellHeader, AppShellMain, Box, Flex, Group } from '@mantine/core';
import { ReactNode } from 'react';
import ThemeSelector from '../../action/ThemeSelector';
import Logo from '../../identity/Logo';
import AppNavigation from '../../navigation/AppNavigation/AppNavigation';
import MenuNavigation from '../../navigation/menuNavigation/MenuNavigation';

type props = {
    children: ReactNode
}
const MainLayout = ({ children }: props) => {

    return (
        <AppShell
            header={{ height: 65 }}
            layout='alt'
            padding={0}
            withBorder={true}
        >
            <AppShellHeader
                style={{
                    boxShadow: "var(--mantine-shadow-xl)",
                    borderBottomLeftRadius: "var(--mantine-radius-lg)",
                    borderBottomRightRadius: "var(--mantine-radius-lg)",
                    backdropFilter: "blur(5px)",          // <-- blur effect
                    WebkitBackdropFilter: "blur(5px)",    // <-- Safari support
                    backgroundColor: "color-mix(in srgb, var(--color-background-card) 80%, transparent)",

                }}
                mx={5}
            >
                <Flex justify="space-between" align="center" h="100%" px="lg">
                    <Logo
                        width={50}
                        height={50}
                        isLink
                        href={PATHS.home.index}
                    />
                    <Box visibleFrom='md'>
                        <AppNavigation
                            links={questLinks}
                            navLinkProps={{
                                styles: {
                                    root: {
                                        transition: 'background-color 150ms ease',
                                        '&:hover': {
                                            backgroundColor: '#e6e6ff !important',
                                        },
                                        '&[dataHovered]': {
                                            backgroundColor: '#e6e6ff',
                                        },
                                        borderRadius: "var(--mantine-radius-md)"
                                    },
                                }


                            }}
                        />
                    </Box>

                    <Group>
                        <ThemeSelector asIcon />
                        <Box hiddenFrom='md'>
                            <MenuNavigation
                                links={questLinks}
                                containerProps={{
                                    width: "75vw",
                                }}
                            />
                        </Box>
                    </Group>
                </Flex>
            </AppShellHeader>
            <AppShellMain>
                {children}
            </AppShellMain>
        </AppShell >
    )
}

export default MainLayout