import AuthLayout from '@/lib/components/layout/auth';
import AppProvider from '@/lib/context/AppProvider';
import { Box } from '@mantine/core';
import "dayjs/locale/ar";
import "dayjs/locale/en";
import { ReactNode } from 'react';

type Props = {
  children: ReactNode,
}


const AuthRootLayout = ({ children }: Props) => {
  return (
    <AppProvider >
      <AuthLayout>
        <Box mih={"calc(100vh - 235px)"} w={"100%"} >
          {children}
        </Box>
      </AuthLayout>
    </AppProvider>
  )
}

export default AuthRootLayout;

