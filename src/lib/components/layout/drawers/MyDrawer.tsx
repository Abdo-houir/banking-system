'use client';

import { ActionIcon, Drawer } from '@mantine/core';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { MdMenu } from 'react-icons/md';
import useBoolean from '../../../hooks/useBoolean';

interface MyDrawerProps {
  children: ReactNode;
}

const MyDrawer: React.FC<MyDrawerProps> = ({ children }) => {
  const open = useBoolean({ initialState: false });
  const pathname = usePathname();

  useEffect(() => {
    open.onFalse();
  }, [pathname]);

  return (
    <>
      <ActionIcon
        p={0}
        variant="subtle"
        size="md"
        radius="md"
        onClick={open.onTrue}
      >
        <MdMenu size={30} />
      </ActionIcon>

      <Drawer
        opened={open.value}
        onClose={open.onFalse}
        withOverlay
        size="sm"
      >
        {children}
      </Drawer>
    </>
  );
};

export default MyDrawer;
