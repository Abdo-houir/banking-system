// components/customer/EmptyAccountsState.tsx
'use client';

import {
  Alert,
  Button,
  Card,
  Center,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowRight,
  IconCashBanknote,
  IconCheck,
  IconCreditCard,
  IconInfoCircle,
  IconPigMoney,
  IconShield,
  IconSparkles,
} from '@tabler/icons-react';
import Link from 'next/link';

interface EmptyAccountsStateProps {
  onOpenCreateAccount: () => void;
  userName: string;
}

export default function EmptyAccountsState({ 
  onOpenCreateAccount, 
  userName 
}: EmptyAccountsStateProps) {
  const accountTypes = [
    {
      icon: <IconPigMoney size={32} />,
      title: 'Savings Account',
      description: 'Earn interest and save for your goals',
      features: ['1.5% APY', 'No monthly fees', '6 withdrawals/month'],
      color: 'green',
    },
    {
      icon: <IconCreditCard size={32} />,
      title: 'Checking Account',
      description: 'Daily transactions and payments',
      features: ['Free debit card', 'Unlimited transactions', '$500 overdraft'],
      color: 'blue',
    },
    {
      icon: <IconCashBanknote size={32} />,
      title: 'Loan Account',
      description: 'Borrow for your needs',
      features: ['Competitive rates', 'Flexible terms', 'Quick approval'],
      color: 'orange',
    },
  ];

  const benefits = [
    {
      icon: <IconShield size={24} />,
      title: 'FDIC Insured',
      description: 'Up to $250,000 per depositor',
    },
    {
      icon: <IconCheck size={24} />,
      title: 'Instant Access',
      description: 'Accounts activated immediately',
    },
    {
      icon: <IconSparkles size={24} />,
      title: 'Digital Banking',
      description: 'Mobile app & online access',
    },
  ];

  return (
    <Container size="lg">
      <Stack gap="xl" align="center">
        {/* Hero Section */}
        <Stack gap="md" align="center" style={{ textAlign: 'center' }}>
          <ThemeIcon size={80} radius="50%" variant="light" color="blue">
            <IconPigMoney size={48} />
          </ThemeIcon>
          
          <Title order={1} size="h2">
            Welcome to Your Banking Dashboard, {userName}!
          </Title>
          
          <Text size="lg" c="dimmed" maw={600}>
            Start your financial journey by opening your first account. 
            Choose from our range of accounts designed to meet your needs.
          </Text>
          
          <Group mt="md">
            <Button 
              size="lg" 
              onClick={onOpenCreateAccount}
              rightSection={<IconArrowRight size={20} />}
            >
              Open Your First Account
            </Button>
            <Button
              size="lg"
              variant="outline"
              component={Link}
              href="/help/getting-started"
            >
              Learn More
            </Button>
          </Group>
        </Stack>

        {/* Alert */}
        <Alert 
          color="blue" 
          icon={<IconInfoCircle size={24} />}
          title="Get started in minutes"
          maw={800}
          w="100%"
        >
          <Text size="sm">
            Opening an account is quick and easy. Simply choose your account type, 
            make your initial deposit, and start banking immediately. 
            All accounts come with full digital banking access.
          </Text>
        </Alert>

        {/* Account Options */}
        <Title order={3} mt="xl">Choose Your Account Type</Title>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" w="100%">
          {accountTypes.map((account, index) => (
            <Card 
              key={index} 
              withBorder 
              radius="lg" 
              padding="xl"
              style={{ 
                borderColor: `var(--mantine-color-${account.color}-6)`,
                borderWidth: 2,
              }}
            >
              <Stack gap="md" align="center">
                <ThemeIcon size={60} radius="lg" color={account.color} variant="light">
                  {account.icon}
                </ThemeIcon>
                
                <div style={{ textAlign: 'center' }}>
                  <Title order={4}>{account.title}</Title>
                  <Text c="dimmed" mt={4}>{account.description}</Text>
                </div>
                
                <Stack gap="xs" w="100%">
                  {account.features.map((feature, idx) => (
                    <Group key={idx} gap="sm">
                      <IconCheck size={16} color="green" />
                      <Text size="sm">{feature}</Text>
                    </Group>
                  ))}
                </Stack>
                
                <Button 
                  fullWidth 
                  mt="md"
                  color={account.color}
                  onClick={onOpenCreateAccount}
                >
                  Open {account.title}
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        {/* Benefits */}
        <Card withBorder radius="lg" w="100%" maw={800}>
          <Title order={3} mb="xl" style={{ textAlign: 'center' }}>
            Why Bank With Us?
          </Title>
          
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            {benefits.map((benefit, index) => (
              <Stack key={index} gap="sm" align="center">
                <ThemeIcon size={50} radius="lg" variant="light" color="blue">
                  {benefit.icon}
                </ThemeIcon>
                <div style={{ textAlign: 'center' }}>
                  <Text fw={600}>{benefit.title}</Text>
                  <Text size="sm" c="dimmed">{benefit.description}</Text>
                </div>
              </Stack>
            ))}
          </SimpleGrid>
        </Card>

        {/* FAQ */}
        <Card withBorder radius="lg" w="100%" maw={800}>
          <Title order={3} mb="md">Frequently Asked Questions</Title>
          
          <Stack gap="md">
            <div>
              <Text fw={600}>What do I need to open an account?</Text>
              <Text size="sm" c="dimmed">
                You will need a valid government-issued ID and your Social Security Number. 
                The entire process takes about 10 minutes.
              </Text>
            </div>
            
            <div>
              <Text fw={600}>Is there a minimum deposit?</Text>
              <Text size="sm" c="dimmed">
                Savings accounts require a minimum $25 deposit, while checking accounts require $50. 
                Loan accounts have no minimum deposit requirement.
              </Text>
            </div>
            
            <div>
              <Text fw={600}>When will my account be active?</Text>
              <Text size="sm" c="dimmed">
                Your account will be activated immediately upon approval, 
                giving you instant access to online and mobile banking.
              </Text>
            </div>
          </Stack>
        </Card>

        {/* Final CTA */}
        <Center py="xl">
          <Stack gap="md" align="center">
            <Title order={3}>Ready to Get Started?</Title>
            <Text c="dimmed" maw={500} style={{ textAlign: 'center' }}>
              Join thousands of satisfied customers who trust us with their financial needs. 
              Your journey to better banking starts here.
            </Text>
            <Button 
              size="lg" 
              onClick={onOpenCreateAccount}
              rightSection={<IconArrowRight size={20} />}
              style={{ marginTop: 20 }}
            >
              Open Your Account Now
            </Button>
          </Stack>
        </Center>
      </Stack>
    </Container>
  );
}