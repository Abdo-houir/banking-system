import { Flex, Stack, Text } from '@mantine/core';
import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title?: ReactNode;
  subTitle?: ReactNode;
  action?: ReactNode;
  full?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subTitle,
  action,
  full = false,
}) => {
  return (
    <Flex
      w="100%"
      justify="space-between"
      align={{base:"normal",md: full? "normal" : "center"}}
      direction={{ base: 'column', md: full ? 'column' : 'row' }}
      gap={20}
    >
      <Stack gap={1} w={{ base: '100%', lg: full ? '100%' : '50%' }}>
        {title && (
          <Text
            fw={900}
            fz={{ base: 'h4', md: 'h3', lg: 'h2', xl: 'h1' }}
            c="var(--color-primary-main)"
          >
            {title}
          </Text>
        )}
        {subTitle && (
          <Text
            variant="text"
            fw="bold"
            fz={{ base: 'h5', md: 'h4', lg: 'h3', xl: 'h2' }}
          >
            {subTitle}
          </Text>
        )}
      </Stack>
      {action && action}
    </Flex>
  );
};

export default PageHeader;
