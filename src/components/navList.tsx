import { SearchInputDocs } from "@/app/smartcampus/documents/search-input-docs";
import { SearchInputAgent } from "@/app/smartcampus/chat/search-input-agent";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
import Link from "next/link";
import { NavListEnum, NavListProps } from "@/constants/interfaces";

export function NavSearchSlot({ searchItem }: Pick<NavListProps, "searchItem">) {
    switch (searchItem) {
        case NavListEnum.DOCUMENTS:
            return <SearchInputDocs />;
        case NavListEnum.CHAT:
            return <SearchInputAgent />;
        default: {
            const _exhaustive: never = searchItem;
            return _exhaustive;
        }
    }
}

export const NavList = ({ searchItem }: NavListProps) => {
    return (
        <div className="flex">
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            {/* 要从根路径做跳转 否则会拼接造成重复 */}
                            <Link href="/smartcampus/documents">协同文档</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/smartcampus/chat">智能助手</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
            <NavSearchSlot searchItem={searchItem} />
        </div>
    );
};
