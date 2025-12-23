import { adminLinks, customerLinks, managerLinks, questLinks, tellerLinks } from "@/config-nav";
import { getCurrentUser } from "@/lib/auth";
import {
    List,
    ListProps,
    NavLinkProps,
    ScrollArea
} from "@mantine/core";
import RenderSidebarLinks from "./RenderSidebarLinks";


type Props = {
    invertIcon?: boolean;
    navLinkProps?: NavLinkProps;
    containerProps?: ListProps;
    isIconOnlyProp?: string
};

const SidebarNavigation = async ({
    navLinkProps,
    containerProps,
    invertIcon = false,
    isIconOnlyProp
}: Props) => {
    const user = await getCurrentUser();
    let links = questLinks;

    if (user) {
        switch (user.role) {
            case "ADMIN":
                links = adminLinks
                break;
            case "CUSTOMER":
                links = customerLinks
                break;
            case "TELLER":
                links = tellerLinks
                break;
            case "MANAGER":
                links = managerLinks
                break;
            default:
                break;
        }
    }
    return (
        <ScrollArea
            h={"100%"}
            mah={"100%"}
        >
            <List {...containerProps}>
                <RenderSidebarLinks
                    items={links}
                    full={false}
                    invertIcon={invertIcon}
                    isIconOnlyProp={isIconOnlyProp}
                    navLinkProps={navLinkProps}
                />
            </List>
        </ScrollArea>
    )
};

export default SidebarNavigation;
