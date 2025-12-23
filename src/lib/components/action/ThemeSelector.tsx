"use client"
import { ActionIcon, Button, MantineColorScheme, Menu, MenuDropdown, MenuItem, MenuLabel, MenuTarget, Tooltip, useMantineColorScheme } from "@mantine/core";
import { FaCloudMoon, FaCloudSun } from "react-icons/fa";
import { GrSystem } from "react-icons/gr";
import { PiChecksBold } from "react-icons/pi";

const ThemeMods = [
    {
        icon: <GrSystem />,
        color: "var(--mantine-primary-color-5)",
        label: "system preference",
        shortLabel: "auto"
    },
    {
        icon: <FaCloudMoon />,
        color: "indigo",
        label: "dark mode",
        shortLabel: "dark"
    },
    {
        icon: <FaCloudSun />,
        color: "orange",
        label: "light mode",
        shortLabel: "light"

    }
];

type Props = {
    asIcon?: boolean
}
const ThemeSelector = ({ asIcon = false }: Props) => {
    const { setColorScheme, colorScheme } = useMantineColorScheme();

    const currentThemeMode = ThemeMods.find((themeMode) => themeMode.shortLabel === colorScheme) || ThemeMods[0];

    return (
        <Menu position="bottom">
            <MenuTarget>
                {
                    asIcon
                        ?
                        <Tooltip label={currentThemeMode.label}>
                            <ActionIcon
                                variant="transparent"
                                size="lg"
                                radius="xl"
                                aria-label="Toggle color scheme"
                                color={currentThemeMode.color}
                            >
                               {currentThemeMode.icon}
                            </ActionIcon>
                        </Tooltip>
                        :
                        <Button
                            variant="light"
                            style={{
                                textTransform: "capitalize"
                            }}
                            color={currentThemeMode.color}
                            leftSection={currentThemeMode.icon}
                            radius="md"
                        >
                            {currentThemeMode.shortLabel}
                        </Button>
                }
            </MenuTarget>
            <MenuDropdown >
                <MenuLabel>select theme mode</MenuLabel>
                {
                    ThemeMods.map((themeMode) => {

                        return (
                            <MenuItem
                                leftSection={themeMode.icon}
                                rightSection={currentThemeMode.shortLabel === themeMode.shortLabel && <PiChecksBold color="teal" />}
                                color={themeMode.color}
                                onClick={() => setColorScheme(themeMode.shortLabel as MantineColorScheme)}
                                key={themeMode.shortLabel}
                            >
                                {themeMode.label}
                            </MenuItem>
                        );
                    })
                }
            </MenuDropdown>
        </Menu>
    )
}

export default ThemeSelector