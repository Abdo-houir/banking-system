'use client';

import { endpoints } from '@/types/api';
import { AccountType, AccountTypes, getAccountTypeDisplay, getMinimumDeposit } from '@/validation/account';
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  NumberInput,
  Radio,
  Select,
  Stack,
  Stepper,
  Text,
  TextInput,
  ThemeIcon,
  Title
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconCalculator,
  IconCalendar,
  IconCashBanknote,
  IconCheck,
  IconCreditCard,
  IconCurrencyDollar,
  IconInfoCircle,
  IconPigMoney,
  IconPlus,
  IconWallet
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CreateAccountModalProps {
  opened?: boolean;
  onClose?: () => void;
}

const accountTypes = [
  {
    value: AccountTypes.SAVINGS,
    label: 'Savings Account',
    description: 'Earn interest on your deposits',
    icon: <IconPigMoney size={24} />,
    features: [
      'Competitive interest rates (1.5% APY)',
      'No monthly fees',
      '6 free withdrawals per month',
      'FDIC insured up to $250,000'
    ],
    color: 'green'
  },
  {
    value: AccountTypes.CHECKING,
    label: 'Checking Account',
    description: 'Daily transactions and payments',
    icon: <IconCreditCard size={24} />,
    features: [
      'Free debit card & checks',
      'Unlimited transactions',
      '$500 overdraft protection',
      'Mobile check deposit'
    ],
    color: 'blue'
  },
  {
    value: AccountTypes.LOAN,
    label: 'Loan Account',
    description: 'Personal or business loans',
    icon: <IconCashBanknote size={24} />,
    features: [
      'Competitive interest rates',
      'Flexible repayment terms',
      'Quick approval process',
      'No prepayment penalties'
    ],
    color: 'orange'
  }
];

export default function CreateAccountModal({ opened: externalOpened, onClose: externalOnClose }: CreateAccountModalProps) {
  const router = useRouter();
  const [internalOpened, setInternalOpened] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const opened = externalOpened !== undefined ? externalOpened : internalOpened;
  const onClose = externalOnClose || (() => setInternalOpened(false));

  const form = useForm({
    initialValues: {
      // Common fields
      accountType: '',
      accountName: '',
      monthlyStatements: 'electronic',
      
      // Savings/Checking fields
      initialDeposit: 0,
      interestRate: 1.5,
      overdraftProtection: true,
      debitCard: true,
      
      // Loan fields
      loanAmount: 1000,
      loanTerm: 5, // years
      interestRateLoan: 5, // percentage
      purpose: '',
      collateralDescription: '',
      employmentStatus: 'employed' as const,
      monthlyIncome: 0,
    },
    
    validate: (values) => {
      const errors: any = {};
      
      if (activeStep === 0) {
        if (!values.accountType) {
          errors.accountType = 'Please select an account type';
        }
      }
      
      if (activeStep === 1) {
        if (values.accountType === AccountTypes.SAVINGS || values.accountType === AccountTypes.CHECKING) {
          const minDeposit = getMinimumDeposit(values.accountType);
          if (values.initialDeposit < minDeposit) {
            errors.initialDeposit = `Minimum deposit is $${minDeposit}`;
          }
          if (values.initialDeposit > 100000) {
            errors.initialDeposit = 'Maximum initial deposit is $100,000';
          }
        } 
        else if (values.accountType === AccountTypes.LOAN) {
          if (values.loanAmount < 1000) {
            errors.loanAmount = 'Minimum loan amount is $1,000';
          }
          if (values.loanAmount > 500000) {
            errors.loanAmount = 'Maximum loan amount is $500,000';
          }
          if (values.loanTerm < 1 || values.loanTerm > 30) {
            errors.loanTerm = 'Loan term must be between 1 and 30 years';
          }
          if (values.interestRateLoan < 1 || values.interestRateLoan > 25) {
            errors.interestRateLoan = 'Interest rate must be between 1% and 25%';
          }
        }
      }
      
      if (activeStep === 2) {
        if (!values.accountName?.trim()) {
          errors.accountName = 'Please give your account a name';
        }
        if (values.accountType === AccountTypes.LOAN && !values.purpose?.trim()) {
          errors.purpose = 'Please describe the loan purpose';
        }
      }
      
      return errors;
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // Prepare data based on account type
      let requestData: any = {
        accountType: values.accountType,
        accountName: values.accountName,
        monthlyStatements: values.monthlyStatements,
      };

      if (values.accountType === AccountTypes.SAVINGS) {
        requestData = {
          ...requestData,
          initialDeposit: values.initialDeposit,
          interestRate: values.interestRate,
        };
      } 
      else if (values.accountType === AccountTypes.CHECKING) {
        requestData = {
          ...requestData,
          initialDeposit: values.initialDeposit,
          overdraftProtection: values.overdraftProtection,
          debitCard: values.debitCard,
        };
      }
      else if (values.accountType === AccountTypes.LOAN) {
        requestData = {
          ...requestData,
          loanAmount: values.loanAmount,
          loanTerm: values.loanTerm,
          interestRate: values.interestRateLoan,
          purpose: values.purpose,
          collateralDescription: values.collateralDescription,
          employmentStatus: values.employmentStatus,
          monthlyIncome: values.monthlyIncome,
        };
      }

      const response = await fetch(endpoints.customer.accountsCreate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        notifications.show({
          title: 'Account Created!',
          message: `Your new ${getAccountTypeDisplay(values.accountType as AccountType)} has been successfully opened`,
          color: 'green',
          icon: <IconCheck size={18} />,
        });

        form.reset();
        setActiveStep(0);
        onClose();
        router.refresh();
      } else {
        // Show validation errors if any
        if (data.errors?.length > 0) {
          data.errors.forEach((error: any) => {
            notifications.show({
              title: 'Validation Error',
              message: error.message,
              color: 'red',
            });
          });
        } else {
          notifications.show({
            title: 'Error',
            message: data.message || 'Failed to create account',
            color: 'red',
          });
        }
      }
    } catch (error) {
      console.log(error);
      notifications.show({
        title: 'Network Error',
        message: 'Please check your connection and try again',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    const validation = form.validate();
    if (!validation.hasErrors) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => setActiveStep(activeStep - 1);

  // Calculate loan monthly payment for preview
  const calculateLoanPayment = () => {
    if (form.values.accountType !== AccountTypes.LOAN) return 0;
    
    const principal = form.values.loanAmount;
    const annualRate = form.values.interestRateLoan;
    const termYears = form.values.loanTerm;
    
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = termYears * 12;
    
    if (monthlyRate === 0) return principal / numberOfPayments;
    
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
           (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  };

  return (
    <>
      {!externalOpened && (
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setInternalOpened(true)}
          variant="filled"
        >
          Open New Account
        </Button>
      )}

      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap="sm">
            <IconWallet size={24} />
            <Title order={4}>Open New Account</Title>
          </Group>
        }
        size="lg"
        centered
        padding="xl"
      >
        <Stepper active={activeStep} mb="xl">
          <Stepper.Step label="Type" description="Choose account type" />
          <Stepper.Step label="Details" description="Provide details" />
          <Stepper.Step label="Finalize" description="Review & submit" />
        </Stepper>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          {/* Step 1: Account Type Selection */}
          {activeStep === 0 && (
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Select the type of account you would like to open
              </Text>

              <Stack gap="md">
                {accountTypes.map((type) => (
                  <Card
                    key={type.value}
                    withBorder
                    radius="md"
                    p="lg"
                    style={{
                      borderColor: form.values.accountType === type.value 
                        ? `var(--mantine-color-${type.color}-6)` 
                        : undefined,
                      cursor: 'pointer',
                      borderWidth: form.values.accountType === type.value ? 2 : 1,
                    }}
                    onClick={() => form.setFieldValue('accountType', type.value)}
                  >
                    <Stack gap="sm">
                      <Group>
                        <ThemeIcon size={40} radius="md" variant="light" color={type.color}>
                          {type.icon}
                        </ThemeIcon>
                        <div>
                          <Text fw={600}>{type.label}</Text>
                          <Text size="sm" c="dimmed">{type.description}</Text>
                        </div>
                      </Group>

                      <Stack gap={4}>
                        {type.features.map((feature, idx) => (
                          <Group key={idx} gap={6}>
                            <IconCheck size={14} color="green" />
                            <Text size="sm">{feature}</Text>
                          </Group>
                        ))}
                      </Stack>

                      {form.values.accountType === type.value && (
                        <Badge color={type.color} variant="light" fullWidth>
                          Selected
                        </Badge>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Stack>

              {form.errors.accountType && (
                <Alert color="red" icon={<IconInfoCircle size={16} />}>
                  {form.errors.accountType}
                </Alert>
              )}

              <Alert color="blue" icon={<IconInfoCircle size={16} />}>
                <Text size="sm">
                  <strong>Important:</strong> All deposits are FDIC insured up to $250,000. 
                  Account approval is subject to verification.
                </Text>
              </Alert>
            </Stack>
          )}

          {/* Step 2: Account Details */}
          {activeStep === 1 && (
            <Stack gap="md">
              {form.values.accountType === AccountTypes.SAVINGS && (
                <>
                  <NumberInput
                    label="Initial Deposit"
                    placeholder="0.00"
                    leftSection={<IconCurrencyDollar size={16} />}
                    min={25}
                    max={100000}
                    step={10}
                    {...form.getInputProps('initialDeposit')}
                    size="md"
                    description="Minimum deposit: $25"
                  />
                  
                  <NumberInput
                    label="Interest Rate (%)"
                    placeholder="1.5"
                    leftSection={<IconCalculator size={16} />}
                    min={0.01}
                    max={10}
                    step={0.01}
                    {...form.getInputProps('interestRate')}
                    size="md"
                    defaultValue={1.5}
                  />
                </>
              )}

              {form.values.accountType === AccountTypes.CHECKING && (
                <>
                  <NumberInput
                    label="Initial Deposit"
                    placeholder="0.00"
                    leftSection={<IconCurrencyDollar size={16} />}
                    min={50}
                    max={100000}
                    step={10}
                    {...form.getInputProps('initialDeposit')}
                    size="md"
                    description="Minimum deposit: $50"
                  />
                  
                </>
              )}

              {form.values.accountType === AccountTypes.LOAN && (
                <>
                  <NumberInput
                    label="Loan Amount"
                    placeholder="1000.00"
                    leftSection={<IconCurrencyDollar size={16} />}
                    min={1000}
                    max={500000}
                    step={100}
                    {...form.getInputProps('loanAmount')}
                    size="md"
                    description="Minimum: $1,000 | Maximum: $500,000"
                  />
                  
                  <NumberInput
                    label="Loan Term (Years)"
                    placeholder="5"
                    leftSection={<IconCalendar size={16} />}
                    min={1}
                    max={30}
                    step={1}
                    {...form.getInputProps('loanTerm')}
                    size="md"
                  />
                  
                  <NumberInput
                    label="Annual Interest Rate (%)"
                    placeholder="5.0"
                    leftSection={<IconCalculator size={16} />}
                    min={1}
                    max={25}
                    step={0.1}
                    {...form.getInputProps('interestRateLoan')}
                    size="md"
                  />
                  
                  <TextInput
                    label="Loan Purpose"
                    placeholder="e.g., Home renovation, Car purchase, Business investment"
                    {...form.getInputProps('purpose')}
                    description="Briefly describe what you'll use the loan for"
                  />
                  
                  <Divider my="sm" />
                  
                  <Card withBorder radius="md" p="md" bg="blue.0">
                    <Text size="sm" fw={500} mb="xs">Loan Preview:</Text>
                    <Stack gap={4}>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Loan Amount:</Text>
                        <Text size="sm" fw={500}>${form.values.loanAmount}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Term:</Text>
                        <Text size="sm" fw={500}>{form.values.loanTerm} years</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Interest Rate:</Text>
                        <Text size="sm" fw={500}>{form.values.interestRateLoan}%</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Estimated Monthly Payment:</Text>
                        <Text size="sm" fw={500}>${calculateLoanPayment()}</Text>
                      </Group>
                    </Stack>
                  </Card>
                </>
              )}

              {Object.keys(form.errors).length > 0 && (
                <Alert color="red" icon={<IconInfoCircle size={16} />}>
                  <Text size="sm">Please fix the errors above before continuing</Text>
                </Alert>
              )}
            </Stack>
          )}

          {/* Step 3: Final Details */}
          {activeStep === 2 && (
            <Stack gap="md">
              <TextInput
                label="Account Nickname"
                placeholder="e.g., Emergency Fund, Vacation Savings, Business Loan"
                description="Give your account a friendly name for easy identification"
                {...form.getInputProps('accountName')}
                required
              />

              {form.values.accountType === AccountTypes.LOAN && (
                <>
                  <Select
                    label="Employment Status"
                    data={[
                      { value: 'employed', label: 'Employed' },
                      { value: 'self-employed', label: 'Self-Employed' },
                      { value: 'unemployed', label: 'Unemployed' },
                      { value: 'retired', label: 'Retired' },
                    ]}
                    {...form.getInputProps('employmentStatus')}
                  />
                  
                  <NumberInput
                    label="Monthly Income (Optional)"
                    placeholder="0.00"
                    leftSection={<IconCurrencyDollar size={16} />}
                    min={0}
                    {...form.getInputProps('monthlyIncome')}
                  />
                  
                  <TextInput
                    label="Collateral Description (Optional)"
                    placeholder="e.g., Property, Vehicle, Investments"
                    {...form.getInputProps('collateralDescription')}
                  />
                </>
              )}

              <Radio.Group
                label="Statement Preference"
                description="How would you like to receive your monthly statements?"
                {...form.getInputProps('monthlyStatements')}
              >
                <Group mt="xs">
                  <Radio value="electronic" label="Electronic (Recommended)" />
                  <Radio value="paper" label="Paper Mail" />
                </Group>
              </Radio.Group>

              <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
                <Text size="sm">
                  <strong>Terms & Conditions:</strong> By opening this account, you agree to 
                  our Terms of Service and Privacy Policy. All accounts are subject to 
                  verification and approval.
                </Text>
              </Alert>

              {/* Summary Card */}
              <Card withBorder radius="md" p="md">
                <Text size="sm" fw={500} mb="xs">Account Summary:</Text>
                <Stack gap={4}>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Account Type:</Text>
                    <Text size="sm" fw={500}>{getAccountTypeDisplay(form.values.accountType as AccountType)}</Text>
                  </Group>
                  
                  {form.values.accountType !== AccountTypes.LOAN && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Initial Deposit:</Text>
                      <Text size="sm" fw={500}>${form.values.initialDeposit}</Text>
                    </Group>
                  )}
                  
                  {form.values.accountType === AccountTypes.LOAN && (
                    <>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Loan Amount:</Text>
                        <Text size="sm" fw={500}>${form.values.loanAmount}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Monthly Payment:</Text>
                        <Text size="sm" fw={500}>${calculateLoanPayment()}</Text>
                      </Group>
                    </>
                  )}
                  
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Account Name:</Text>
                    <Text size="sm" fw={500}>{form.values.accountName || 'Not specified'}</Text>
                  </Group>
                </Stack>
              </Card>
            </Stack>
          )}

          <Group justify="space-between" mt="xl">
            {activeStep > 0 ? (
              <Button variant="default" onClick={prevStep} disabled={loading}>
                Back
              </Button>
            ) : (
              <Button variant="default" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            )}

            {activeStep < 2 ? (
              <Button onClick={nextStep} disabled={loading}>
                Continue
              </Button>
            ) : (
              <Button type="submit" loading={loading} color={
                form.values.accountType === AccountTypes.LOAN ? 'orange' : 'blue'
              }>
                {form.values.accountType === AccountTypes.LOAN ? 'Apply for Loan' : 'Open Account'}
              </Button>
            )}
          </Group>
        </form>
      </Modal>
    </>
  );
}