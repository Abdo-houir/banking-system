"use client"
import { ActionIcon, Box, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { FaCloudMoon, FaCloudSun } from "react-icons/fa";


const ThemeToggle = () => {
    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
    return (
        <ActionIcon
            onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
            variant="transparent"
            size="lg"
            radius="xl"
            aria-label="Toggle color scheme"
            color={computedColorScheme === 'light'? "orange" : "indigo"}
        >
            <Box darkHidden>
                <FaCloudSun />
            </Box>
            <Box lightHidden>
                <FaCloudMoon />
            </Box>
        </ActionIcon>
    )
}

export default ThemeToggle