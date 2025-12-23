import PATHS from "@/paths";
import { AppShell, AppShellAside, AppShellHeader, AppShellMain, Box, Button, Flex, Group, Stack } from "@mantine/core";
import Link from "next/link";
import { ReactNode } from "react";
import { IoReturnDownBack } from "react-icons/io5";
import ThemeSelector from "../../action/ThemeSelector";
import Logo from "../../identity/Logo";

type Props = {
    children: ReactNode
}

const AuthLayout = ({ children }: Props) => {

    return (
        <AppShell
            header={{ height: 65 }}
            aside={{
                width: { base: 0, md: "50vw" },
                breakpoint: 'md',
                collapsed: { mobile: true },
            }}
            layout='alt'
            withBorder={false}
            styles={{
                header: { backgroundColor: "var(--color-background-primary)" },
                main: { backgroundColor: "var(--color-background-card)" },
            }}
        >
            <AppShellHeader>
                <Flex justify="space-between" align="center" w={"100%"} px="md" h={"100%"}>
                    <Group>
                        <ThemeSelector asIcon />
                    </Group>
                    <Link href={PATHS.home.index}>
                        <Button
                            leftSection={<IoReturnDownBack size={25} />}
                            variant="light"
                            color="red"
                        >
                           back home
                        </Button>
                    </Link>
                </Flex>
            </AppShellHeader>
            <AppShellMain >
                <Stack justify="center" align="center" mih={"100%"} px="md" >
                    <Logo
                        width={150}
                        height={150}
                    />
                    {children}
                </Stack>
            </AppShellMain>
            <AppShellAside>
                <Box w="100%" h="100%" >
                    {/* <Image
                        src='/bg/SyriaEmb.jpg'
                        alt="SyriaEmb"
                        style={{
                            backgroundSize: "contain",
                            backgroundPosition: "center",
                            width: "100%",
                            height:"100%"
                        }}
                        width={1000}
                        height={1000}
                    /> */}
                </Box>
            </AppShellAside>
        </AppShell>
    )
}

export default AuthLayout