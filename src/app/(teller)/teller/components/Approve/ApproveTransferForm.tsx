// app/dashboard/teller/components/ApproveTransferForm.tsx
'use client';

import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useState } from 'react';

interface ApproveTransferFormProps {
  approval: any;
  type: 'approved' | 'rejected';
}

export default function ApproveTransferForm({ approval, type }: ApproveTransferFormProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState('');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/approvals/${approval.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            decision: type, 
            comments: comments || `Transfer ${type}d by teller` 
        }),
      });

      const data = await response.json();

      if (data.success) {
        notifications.show({
          title: 'Success',
          message: `Transfer ${type}d successfully`,
          color: type === 'approved' ? 'green' : 'red',
        });
        close();
        // Refresh the page
        window.location.reload();
      } else {
        notifications.show({
          title: 'Error',
          message: data.message,
          color: 'red',
        });
      }
    } catch (error) {
      console.log(error);
      
      notifications.show({
        title: 'Error',
        message: 'Failed to process decision',
        color: 'red',
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
        title={type === 'approved' ? 'Approve Transfer' : 'Reject Transfer'}
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {type === 'approved' 
              ? 'Are you sure you want to approve this transfer?' 
              : 'Are you sure you want to reject this transfer?'}
          </Text>
          
          <Group gap="xs">
            <Text size="sm" fw={500}>Amount:</Text>
            <Text fw={600} c="blue">
              ${Math.abs(approval.transaction.amount).toFixed(2)}
            </Text>
          </Group>
          
          <Group gap="xs">
            <Text size="sm" fw={500}>Reference:</Text>
            <Text size="sm" c="dimmed">
              {approval.transaction.referenceNumber}
            </Text>
          </Group>

          <Textarea
            label="Comments (Optional)"
            placeholder="Add any comments for this decision..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={close}>
              Cancel
            </Button>
            <Button
              color={type === 'approved' ? 'green' : 'red'}
              loading={loading}
              onClick={handleSubmit}
            >
              {type === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}