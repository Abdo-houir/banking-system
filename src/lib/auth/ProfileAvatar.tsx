import PATHS from "@/paths";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Group,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
  Text,
  UnstyledButton
} from "@mantine/core";
import {
  IconBell,
  IconChevronDown,
  IconCreditCard,
  IconDashboard,
  IconLogout,
  IconUser
} from "@tabler/icons-react";
import Link from "next/link";
import { getCurrentUser, removeServerAuthCookie } from "../auth";

const ProfileAvatar = async () => {
  const user = await getCurrentUser();

  if (user) {
    // Get initials for avatar
    const getInitials = (firstName: string, lastName: string) => {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    // Get role display name
    const getRoleDisplay = (role: string) => {
      const roleMap: Record<string, string> = {
        'ADMIN': 'Administrator',
        'MANAGER': 'Manager',
        'TELLER': 'Teller',
        'CUSTOMER': 'Customer'
      };
      return roleMap[role] || role;
    };

    // Get role color
    const getRoleColor = (role: string) => {
      const colorMap: Record<string, string> = {
        'ADMIN': 'red',
        'MANAGER': 'blue',
        'TELLER': 'green',
        'CUSTOMER': 'gray'
      };
      return colorMap[role] || 'gray';
    };

    const initials = getInitials(user.firstName, user.lastName);
    const roleDisplay = getRoleDisplay(user.role);
    const roleColor = getRoleColor(user.role);

    // Server action for logout
    const handleLogout = async () => {
      'use server';
      await removeServerAuthCookie();
    };

    return (
      <Menu
        shadow="md"
        width={300}
        position="bottom-end"
        withArrow
        arrowPosition="center"
      >
        <MenuTarget>
          <UnstyledButton
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'var(--mantine-color-gray-0)'
              }
            }}
          >
            <Avatar
              size="md"
              radius="xl"
              color={roleColor}
              bg={`var(--mantine-color-${roleColor}-light)`}
            >
              {initials}
            </Avatar>
            <Box style={{ display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>
              <Text size="sm" fw={500}>
                {user.firstName} {user.lastName}
              </Text>
              <Text size="xs" c="dimmed">
                {roleDisplay}
              </Text>
            </Box>
            <IconChevronDown size={16} />
          </UnstyledButton>
        </MenuTarget>

        <MenuDropdown>
          {/* User Info Section */}
          <Box p="sm">
            <Group>
              <Avatar
                size="lg"
                radius="xl"
                color={roleColor}
                bg={`var(--mantine-color-${roleColor}-light)`}
              >
                {initials}
              </Avatar>
              <div>
                <Text fw={500}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text size="sm" c="dimmed">
                  {user.email}
                </Text>
                <Text size="xs" c={roleColor} fw={500}>
                  {roleDisplay}
                </Text>
              </div>
            </Group>
          </Box>

          <Divider />

          {/* Navigation Links */}
          <MenuLabel>Navigation</MenuLabel>

          {user.role === 'ADMIN' && (
            <MenuItem
              component={Link}
              href={PATHS.admin.index}
              leftSection={<IconDashboard size={16} />}
            >
              Admin Dashboard
            </MenuItem>
          )}

          {(user.role === 'TELLER') && (
            <MenuItem
              component={Link}
              href={PATHS.teller.index}
              leftSection={<IconCreditCard size={16} />}
            >
              Teller Dashboard
            </MenuItem>
          )}

          {(user.role === 'MANAGER') && (
            <MenuItem
              component={Link}
              href={PATHS.manager.index}
              leftSection={<IconCreditCard size={16} />}
            >
              manager Dashboard
            </MenuItem>
          )}

          {user.role === 'CUSTOMER' && (
            <MenuItem
              component={Link}
              href={PATHS.customer.index}
              leftSection={<IconCreditCard size={16} />}
            >
              Customer Dashboard
            </MenuItem>
          )}

          <MenuItem
            component={Link}
            href="/profile"
            leftSection={<IconUser size={16} />}
          >
            My Profile
          </MenuItem>

          <MenuItem
            component={Link}
            href="/notifications"
            leftSection={<IconBell size={16} />}
          >
            Notifications
          </MenuItem>


          <Divider />

          {/* Logout Section */}
          <form action={handleLogout}>
            <MenuItem
              type="submit"
              color="red"
              leftSection={<IconLogout size={16} />}
              style={{ cursor: 'pointer' }}
            >
              Logout
            </MenuItem>
          </form>
        </MenuDropdown>
      </Menu>
    );
  } else {
    return (
      <Button
        component={Link}
        href={PATHS.auth.login}
        variant="light"
        leftSection={<IconUser size={16} />}
        size="sm"
      >
        Login
      </Button>
    );
  }
};

export default ProfileAvatar;