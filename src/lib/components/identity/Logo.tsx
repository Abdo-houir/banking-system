import { Box, BoxProps } from '@mantine/core';
import Image from "next/image";
import Link from 'next/link';

type Props = {
  width: number,
  responseWidth?: BoxProps["w"]
  height: number,
  responseHeight?: BoxProps["h"],
  isSmall?: boolean,
  isLink?: boolean,
  href?: string,
}

const smallLogo = "/logo/logo.png";
// const bigLogo = "/logo/CoatOfArmsOfSyria.svg";

const Logo = ({
  height,
  width,
  isSmall = true,
  isLink = false,
  href,
  responseHeight,
  responseWidth
}: Props) => {

  if (isLink && !!href) {
    return (
      <Link href={href}>
        <Box w={responseWidth || width} h={responseHeight || height} component='figure' m={0} p={0}>
          <Image src={isSmall ? smallLogo : smallLogo} alt="Logo" width={width} height={height} style={{ maxWidth: "100%", width: "100%", height: "100%" }} />
        </Box>
      </Link>
    )
  } else {

    return (
      <Box w={responseWidth || width} h={responseHeight || height} component='figure' m={0} p={0}>
        <Image src={isSmall ? smallLogo : smallLogo} alt="Logo" width={width} height={height} style={{ maxWidth: "100%", width: "100%", height: "100%" }} />
      </Box>
    )
  }
}

export default Logo