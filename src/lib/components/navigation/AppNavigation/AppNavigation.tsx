// import AppNavLink from './AppNavLink'
import { Flex, FlexProps, NavLinkProps } from '@mantine/core';
import RenderAppLinks from './RenderAppLinks';

type Props = {
  links: LinkType[];
  invertIcon?: boolean;
  navLinkProps?: NavLinkProps;
  containerProps?: FlexProps
}

const AppNavigation = ({ links, containerProps, invertIcon = false, navLinkProps }: Props) => {
  return (
      <Flex
        justify="space-between"
        align="center"
        gap={4}
        p={0}
        w="fit-content"
        component='ul'
        m={0}
        maw={"100%"}
        style={{overflow: "scroll"}}
        {...containerProps}
      >
        <RenderAppLinks
          items={links}
          invertIcon={invertIcon}
          navLinkProps={navLinkProps}
        />
      </Flex>
  )
}

export default AppNavigation