import AltMainLayout from '@/lib/components/layout/main/alt';
import AppProvider from '@/lib/context/AppProvider';
import { Box } from '@mantine/core';
import "dayjs/locale/ar";
import "dayjs/locale/en";
import { ReactNode } from 'react';

type Props = {
  children: ReactNode,
}



const RootLayout = ({ children }: Props) => {
  return (
    <AppProvider >
      <AltMainLayout>
        <Box mih={"calc(100vh - 80px)"}>
          {children}
        </Box>
      </AltMainLayout>
    </AppProvider>
  )
}

export default RootLayout;

