import { Center, Drawer, DrawerProps, Loader, Pill } from '@mantine/core';
import React, { ReactNode } from 'react';
import { IoMdCloseCircle } from 'react-icons/io';
import { UseBooleanReturn } from '../../../hooks/useBoolean';

interface InfoDrawerProps {
  open: UseBooleanReturn;
  size?: DrawerProps['size'];
  children?: ReactNode;
  position?: "top" | "bottom";
  onClose?: () => void;
  loading?: boolean;
  maxWidth?: number | string
}

const InfoDrawer: React.FC<InfoDrawerProps> = ({
  open,
  size = 'md',
  children,
  position = 'bottom',
  onClose,
  loading = false,
  maxWidth = "65vw"
}) => {
  return (
    <Drawer
      opened={open.value}
      onClose={onClose ?? open.onFalse}
      size={size}
      position={position}
      withCloseButton={false}
      withOverlay
      styles={{
        content: {
          maxWidth: maxWidth,
          marginInline: 'auto',
          borderTopLeftRadius: position === "bottom" ? '1rem' : "0rem",
          borderTopRightRadius: position === "bottom" ? '1rem' : "0rem",
          borderBottomLeftRadius: position === "bottom" ? '0rem' : "1rem",
          borderBottomRightRadius: position === "bottom" ? '0rem' : "1rem",
        },
        body: {
          backgroundColor: "var(--color-background-card)"
        },
        header: {
          width: '100%',
          display: 'block',
          backgroundColor: "var(--color-background-card)"
        },
      }}
      title={
        <Pill
          size="md"
          withRemoveButton
          removeButtonProps={{
            icon: <IoMdCloseCircle size={25} />,
            c: 'red',
            size: 'xl',
            radius: "xl"
          }}
          onRemove={onClose ?? open.onFalse}
          styles={{
            root: {
              width: '100%',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              backgroundColor: "var(--color-background-primary)"
            },
          }}
        />
      }
    >
      {loading ? (
        <Center mih="40dvh">
          <Loader />
        </Center>
      ) : (
        children
      )}
    </Drawer>
  );
};

export default InfoDrawer;
