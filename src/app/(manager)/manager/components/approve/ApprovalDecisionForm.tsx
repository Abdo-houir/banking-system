// app/dashboard/manager/components/ApprovalDecisionForm.tsx
'use client';

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconClock, IconUser, IconX } from '@tabler/icons-react';
import { useState } from 'react';

interface ApprovalDecisionFormProps {
  approval: any;
  type: 'approved' | 'rejected';
}

export default function ApprovalDecisionForm({ approval, type }: ApprovalDecisionFormProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState('');

  // Calculate how long the approval has been pending
  const hoursPending = Math.floor(
    (Date.now() - new Date(approval.createdAt).getTime()) / (1000 * 60 * 60)
  );
  
  const isUrgent = hoursPending > 24;
  const isLargeTransfer = Math.abs(approval.transaction.amount) > 10000;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/approvals/${approval.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          decision: type, 
          comments: comments || `Transfer ${type}d by manager` 
        }),
      });

      const data = await response.json();

      if (data.success) {
        notifications.show({
          title: 'Success',
          message: `Transfer ${type}d successfully`,
          color: type === 'approved' ? 'green' : 'red',
          icon: type === 'approved' ? <IconCheck size={18} /> : <IconX size={18} />,
        });
        close();
        // Refresh the page
        window.location.reload();
      } else {
        notifications.show({
          title: 'Error',
          message: data.message,
          color: 'red',
          icon: <IconAlertCircle size={18} />,
        });
      }
    } catch (error) {
      console.log(error);
      notifications.show({
        title: 'Error',
        message: 'Failed to process decision',
        color: 'red',
        icon: <IconAlertCircle size={18} />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip label={type === 'approved' ? 'Approve Transfer' : 'Reject Transfer'}>
        <ActionIcon
          variant={type === 'approved' ? 'filled' : 'outline'}
          color={type === 'approved' ? 'green' : 'red'}
          size="sm"
          onClick={open}
        >
          {type === 'approved' ? <IconCheck size={14} /> : <IconX size={14} />}
        </ActionIcon>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={close}
        title={
          <Group gap="xs">
            {type === 'approved' ? 'Approve Transfer' : 'Reject Transfer'}
            {isUrgent && (
              <Badge color="red" variant="filled" size="sm">
                URGENT
              </Badge>
            )}
            {isLargeTransfer && (
              <Badge color="orange" variant="light" size="sm">
                LARGE
              </Badge>
            )}
          </Group>
        }
        size="lg"
        centered
      >
        <Stack gap="md">
          {/* Alert for urgent approvals */}
          {isUrgent && (
            <Alert
              variant="filled"
              color="red"
              title="Urgent Approval Required"
              icon={<IconClock size={16} />}
            >
              This transfer has been pending for {hoursPending} hours. Please review immediately.
            </Alert>
          )}

          {/* Transaction Details */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>Transaction Details</Text>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Reference Number:</Text>
              <Text size="sm" fw={500}>{approval.transaction.referenceNumber}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Amount:</Text>
              <Text fw={600} size="lg" c="blue">
                ${Math.abs(approval.transaction.amount).toFixed(2)}
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Created:</Text>
              <Text size="sm">
                {new Date(approval.createdAt).toLocaleString()}
              </Text>
            </Group>
          </Stack>

          <Divider />

          {/* Account Information */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>Account Information</Text>
            <Group gap="md" align="flex-start">
              <div style={{ flex: 1 }}>
                <Text size="sm" c="dimmed" mb={4}>From Account:</Text>
                <Group gap="xs" mb={2}>
                  <IconUser size={14} />
                  <Text size="sm" fw={500}>
                    {approval.transaction.fromAccount?.customer?.firstName}{' '}
                    {approval.transaction.fromAccount?.customer?.lastName}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed" ml={24}>
                  Acc: {approval.transaction.fromAccount?.accountNumber}
                </Text>
              </div>
              <div style={{ flex: 1 }}>
                <Text size="sm" c="dimmed" mb={4}>To Account:</Text>
                <Group gap="xs" mb={2}>
                  <IconUser size={14} />
                  <Text size="sm" fw={500}>
                    {approval.transaction.toAccount?.customer?.firstName}{' '}
                    {approval.transaction.toAccount?.customer?.lastName}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed" ml={24}>
                  Acc: {approval.transaction.toAccount?.accountNumber}
                </Text>
              </div>
            </Group>
          </Stack>

          <Divider />

          {/* Approval Information */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>Approval Information</Text>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Required Role:</Text>
              <Badge
                color={approval.approverRole.role === 'manager' ? 'red' : 'orange'}
                variant="light"
                size="sm"
              >
                {approval.approverRole.role.toUpperCase()}
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Initiated By:</Text>
              <Text size="sm">
                {approval.transaction.user.firstName} {approval.transaction.user.lastName}
                <Text size="xs" c="dimmed">
                  ({approval.transaction.user.role})
                </Text>
              </Text>
            </Group>
            {approval.approver && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Previous Approver:</Text>
                <Text size="sm">
                  {approval.approver.firstName} {approval.approver.lastName}
                </Text>
              </Group>
            )}
          </Stack>

          <Divider />

          {/* Comments Section */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Decision Comments {type === 'rejected' && '(Required for rejections)'}
            </Text>
            <Textarea
              placeholder={
                type === 'approved' 
                  ? "Add any comments about this approval..."
                  : "Please provide a reason for rejecting this transfer..."
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              required={type === 'rejected'}
              withAsterisk={type === 'rejected'}
            />
          </Stack>

          {/* Action Buttons */}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={close} disabled={loading}>
              Cancel
            </Button>
            <Button
              color={type === 'approved' ? 'green' : 'red'}
              loading={loading}
              onClick={handleSubmit}
              disabled={type === 'rejected' && !comments.trim()}
              leftSection={type === 'approved' ? <IconCheck size={16} /> : <IconX size={16} />}
            >
              {type === 'approved' ? 'Approve Transfer' : 'Reject Transfer'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}