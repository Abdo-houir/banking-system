import { BsHouseDoor } from "react-icons/bs";
import { FaPeopleGroup, FaUsersGear } from "react-icons/fa6";
import { MdAccountBalanceWallet, MdSpaceDashboard } from "react-icons/md";
import PATHS from "./paths";

export const questLinks: LinkType[] = [
  {
    href: PATHS.home.index,
    label: "home",
    icon: <BsHouseDoor />,
  }
];

export const adminLinks: LinkType[] = [
  {
    href: PATHS.admin.index,
    label: "dashboard",
    icon: <MdSpaceDashboard />,
  },
  {
    href: PATHS.admin.employees,
    label: "employees",
    icon: <FaUsersGear />,
  },
  {
    href: PATHS.admin.customers,
    label: "customers",
    icon: <FaPeopleGroup />,
  },
  {
    href: PATHS.admin.accounts,
    label: "accounts",
    icon: <MdAccountBalanceWallet />,
  },
  ...questLinks
];

export const tellerLinks: LinkType[] = [
  {
    href: PATHS.teller.index,
    label: "dashboard",
    icon: <MdSpaceDashboard />,
  },
  ...questLinks
]; 

export const managerLinks: LinkType[] = [
  {
    href: PATHS.manager.index,
    label: "dashboard",
    icon: <MdSpaceDashboard />,
  },
  ...questLinks
];

export const customerLinks: LinkType[] = [
  {
    href: PATHS.customer.index,
    label: "dashboard",
    icon: <MdSpaceDashboard />,
  },
  ...questLinks
]; 