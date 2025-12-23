// src/app/page.tsx
import {
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title
} from '@mantine/core';
import {
  IconArrowRight,
  IconBuildingBank,
  IconChartBar,
  IconClock,
  IconCreditCard,
  IconLock,
  IconMail,
  IconMapPin,
  IconPhone,
  IconShieldCheck,
  IconTransfer
} from '@tabler/icons-react';
import Link from 'next/link';

export default function LandingPage() {
  const features = [
    {
      icon: <IconShieldCheck size={28} />,
      title: 'Military-Grade Security',
      description: '256-bit encryption and multi-factor authentication to keep your funds safe.',
      color: 'green',
    },
    {
      icon: <IconClock size={28} />,
      title: '24/7 Access',
      description: 'Manage your accounts anytime, anywhere with our mobile and web apps.',
      color: 'blue',
    },
    {
      icon: <IconTransfer size={28} />,
      title: 'Instant Transfers',
      description: 'Send money to anyone, anywhere in seconds with zero fees.',
      color: 'violet',
    },
    {
      icon: <IconChartBar size={28} />,
      title: 'Smart Analytics',
      description: 'Track spending, set budgets, and get personalized financial insights.',
      color: 'orange',
    },
    {
      icon: <IconCreditCard size={28} />,
      title: 'Virtual Cards',
      description: 'Generate disposable cards for safe online shopping.',
      color: 'pink',
    },
    {
      icon: <IconLock size={28} />,
      title: 'Fraud Protection',
      description: 'Real-time monitoring and instant alerts on suspicious activity.',
      color: 'red',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Sign Up',
      description: 'Create your account in minutes with just an email and phone number.',
    },
    {
      step: '02',
      title: 'Verify Identity',
      description: 'Complete KYC verification securely through our automated system.',
    },
    {
      step: '03',
      title: 'Open Account',
      description: 'Choose from savings, checking, or investment accounts.',
    },
    {
      step: '04',
      title: 'Start Banking',
      description: 'Deposit funds and begin using all our banking features.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Small Business Owner',
      content: 'The approval workflow saved my business. Large transfers now get approved instantly by my manager.',
      avatar: 'SC',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Freelancer',
      content: 'Scheduled payments have automated my entire billing process. Never miss a payment again.',
      avatar: 'MR',
    },
    {
      name: 'Jessica Park',
      role: 'Student',
      content: 'The multi-tier approval system gives me peace of mind for large transactions.',
      avatar: 'JP',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container size="xl" py={120}>
          <Group justify='space-between' align="center">
            <Stack gap="xl" style={{ flex: 1 }}>
              <Badge size="lg" variant="filled" color="blue" radius="xl">
                Next-Gen Banking
              </Badge>

              <Title order={1} size={60} fw={800} style={{ lineHeight: 1.1 }}>
                Modern Banking{' '}
                <Text
                  component="span"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  inherit
                >
                  Reimagined
                </Text>
              </Title>

              <Text size="xl" style={{ opacity: 0.9, maxWidth: 600 }}>
                Experience seamless banking with multi-tier approvals, scheduled transfers,
                and real-time notifications. Built for security, designed for simplicity.
              </Text>

              <Group mt={40}>
                <Link href="/auth/register" passHref>
                  <Button
                    size="xl"
                    radius="xl"
                    rightSection={<IconArrowRight size={20} />}
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan' }}
                  >
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/auth/login" passHref>
                  <Button
                    size="xl"
                    radius="xl"
                    variant="outline"
                    color="gray"
                    style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                  >
                    Sign In
                  </Button>
                </Link>
              </Group>
            </Stack>

            <Box
              pos="relative"
              flex={1}
              display={{ base: "none", md: "block" }}
            >
              <Box
                style={{
                  width: 500,
                  height: 400,
                  background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            </Box>
          </Group>
        </Container>
      </Box>

      {/* Features Section */}
      <Container size="xl" py={100}>
        <Stack align="center" gap="xs" mb={60}>
          <Text c="dimmed" fw={600} tt="uppercase" size="sm">
            Why Choose Us
          </Text>
          <Title order={2} size={48} fw={800} ta="center">
            Banking Features{' '}
            <Text
              component="span"
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
              inherit
            >
              That Matter
            </Text>
          </Title>
          <Text size="lg" color="dimmed" ta="center" style={{ maxWidth: 600 }}>
            Built with cutting-edge technology to provide you with the best banking experience
          </Text>
        </Stack>

        <SimpleGrid
          cols={{ base: 1, md: 2, lg: 3 }}
          spacing={30}
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              shadow="md"
              radius="lg"
              p="xl"
              style={{
                border: '1px solid #e9ecef',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                },
              }}
            >
              <ThemeIcon
                size={60}
                radius="lg"
                variant="gradient"
                gradient={{ from: feature.color, to: feature.color, deg: 45 }}
                mb="md"
              >
                {feature.icon}
              </ThemeIcon>
              <Text size="lg" fw={600} mb="sm">
                {feature.title}
              </Text>
              <Text c="dimmed">{feature.description}</Text>
            </Card>
          ))}
        </SimpleGrid>
      </Container>

      {/* How It Works */}
      <Box
        style={{
          background: 'var(--color-background-card)',
        }}
        py={100}
      >
        <Container size="xl">
          <Stack align="center" gap="xs" mb={60}>
            <Text c="dimmed" fw={600} tt="uppercase" size="sm">
              Simple Process
            </Text>
            <Title order={2} size={48} fw={800} ta="center">
              Get Started in{' '}
              <Text
                component="span"
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
                inherit
              >
                4 Easy Steps
              </Text>
            </Title>
          </Stack>

          <SimpleGrid
            cols={{ base: 1, md: 2, lg: 4 }}
            spacing={30}
          >
            {howItWorks.map((step, index) => (
              <Stack key={index} align="center" gap="md">
                <Box
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontfw: 800,
                    fontSize: 32,
                  }}
                >
                  {step.step}
                </Box>
                <Stack gap="xs" align="center">
                  <Text size="xl" fw={700}>
                    {step.title}
                  </Text>
                  <Text c="dimmed" ta="center">
                    {step.description}
                  </Text>
                </Stack>
              </Stack>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Testimonials */}
      <Container size="xl" py={100}>
        <Stack align="center" gap="xs" mb={60}>
          <Text c="dimmed" fw={600} tt="uppercase" size="sm">
            Customer Stories
          </Text>
          <Title order={2} size={48} fw={800} ta="center">
            Trusted by{' '}
            <Text
              component="span"
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
              inherit
            >
              Thousands
            </Text>
          </Title>
        </Stack>

        <SimpleGrid
          cols={{ base: 1, md: 2, lg: 3 }}
          spacing={30}
        >
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              shadow="sm"
              radius="lg"
              p="xl"
              style={{
                border: '1px solid #e9ecef',
                position: 'relative',
              }}
            >
              <Box
                style={{
                  position: 'absolute',
                  top: 20,
                  left: 20,
                  fontSize: 48,
                  color: '#e9ecef',
                  fontFamily: 'serif',
                }}
              >
                &quot;
              </Box>
              <Text size="lg"  style={{ position: 'relative', zIndex: 1, mt: 20 }}>
                {testimonial.content}
              </Text>
              <Divider my="md" />
              <Group>
                <Avatar color="blue" radius="xl">
                  {testimonial.avatar}
                </Avatar>
                <Stack gap={0}>
                  <Text fw={600}>{testimonial.name}</Text>
                  <Text size="sm" color="dimmed">
                    {testimonial.role}
                  </Text>
                </Stack>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Container>

      {/* CTA Section */}
      <Box
        style={{
          background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
          color: 'white',
          margin: '0 auto 100px',
          maxWidth: 1200,
        }}
        bdrs="lg"
        py={80}
        px={40}
      >
        <Container size="md" >
          <Stack align="center" gap="xl">
            <Title order={2} size={48} fw={800} ta="center">
              Ready to Transform Your{' '}
              <Text
                component="span"
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
                inherit
              >
                Banking Experience?
              </Text>
            </Title>
            <Text size="lg" ta="center" style={{ opacity: 0.9, maxWidth: 600 }}>
              Join thousands of satisfied customers who trust us with their financial needs
            </Text>
            <Group mt={20}>
              <Link href="/auth/register" passHref>
                <Button
                  size="xl"
                  radius="xl"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  rightSection={<IconArrowRight size={20} />}
                >
                  Create Free Account
                </Button>
              </Link>
              <Link href="/demo" passHref>
                <Button
                  size="xl"
                  radius="xl"
                  variant="outline"
                  color="gray"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                >
                  Watch Demo
                </Button>
              </Link>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        style={{
          borderTop: '1px solid #e9ecef',
          background: 'var(--color-background-card)',
        }}
        py={60}
      >
        <Container size="xl">
          <SimpleGrid
            cols={{ base: 1, md: 2, lg: 4 }}
            spacing={30}
          >
            <Stack gap="md">
              <Group gap="xs">
                <IconBuildingBank size={32} color="#3b82f6" />
                <Text size="xl" fw={800}>
                  BankFlow
                </Text>
              </Group>
              <Text c="dimmed">
                Modern banking solutions for individuals and businesses. Secure, fast, and reliable.
              </Text>
            </Stack>

            <Stack gap="md">
              <Text fw={600} size="lg">
                Features
              </Text>
              <Anchor component={Link} href="/features" color="dimmed">
                Multi-Tier Approvals
              </Anchor>
              <Anchor component={Link} href="/features" color="dimmed">
                Scheduled Transfers
              </Anchor>
              <Anchor component={Link} href="/features" color="dimmed">
                Real-Time Notifications
              </Anchor>
              <Anchor component={Link} href="/features" color="dimmed">
                Account Management
              </Anchor>
            </Stack>

            <Stack gap="md">
              <Text fw={600} size="lg">
                Company
              </Text>
              <Anchor component={Link} href="/about" color="dimmed">
                About Us
              </Anchor>
              <Anchor component={Link} href="/careers" color="dimmed">
                Careers
              </Anchor>
              <Anchor component={Link} href="/security" color="dimmed">
                Security
              </Anchor>
              <Anchor component={Link} href="/contact" color="dimmed">
                Contact
              </Anchor>
            </Stack>

            <Stack gap="md">
              <Text fw={600} size="lg">
                Contact Info
              </Text>
              <Group gap="sm">
                <IconMapPin size={18} color="#6c757d" />
                <Text c="dimmed">123 Finance Street, Banking City</Text>
              </Group>
              <Group gap="sm">
                <IconPhone size={18} color="#6c757d" />
                <Text c="dimmed">+1 (555) 123-4567</Text>
              </Group>
              <Group gap="sm">
                <IconMail size={18} color="#6c757d" />
                <Text c="dimmed">support@bankflow.com</Text>
              </Group>
            </Stack>
          </SimpleGrid>

          <Divider my={40} />

          <Group justify='space-between'>
            <Text c="dimmed">
              © {new Date().getFullYear()} BankFlow. All rights reserved.
            </Text>
            <Group gap="lg">
              <Anchor component={Link} href="/privacy" color="dimmed" size="sm">
                Privacy Policy
              </Anchor>
              <Anchor component={Link} href="/terms" color="dimmed" size="sm">
                Terms of Service
              </Anchor>
              <Anchor component={Link} href="/cookies" color="dimmed" size="sm">
                Cookie Policy
              </Anchor>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}