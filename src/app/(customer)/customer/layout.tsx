import ServicesLayout from '@/lib/components/layout/services';
import AppProvider from '@/lib/context/AppProvider';
import { Box } from '@mantine/core';
import "dayjs/locale/ar";
import "dayjs/locale/en";
import { ReactNode } from 'react';

type Props = {
  children: ReactNode,
}


const CustomerLayout = ({ children }: Props) => {
  return (
    <AppProvider >
      <ServicesLayout>
        <Box mih={"calc(100vh - 80px)"}>
          {children}
        </Box>
      </ServicesLayout>
    </AppProvider>
  )
}

export default CustomerLayout;

