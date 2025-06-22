import { SearchInputArticles } from "@/app/smartcampus/(home)/search-input-articles";
import { SearchInput } from "@/app/smartcampus/documents/search-input";
import ChatInput from "@/app/smartcampus/chat/chat-input";
import {
    NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
import Link from "next/link";
import { NavListEnum, NavListProps } from "@/constants/interfaces";

// 渲染搜索组件的函数
const renderSearchComponent = (searchItem: NavListEnum) => {
    switch (searchItem) {
        case NavListEnum.ARTICLES:
            return <SearchInputArticles />;
        case NavListEnum.DOCUMENTS:
            return <SearchInput />;
        case NavListEnum.CHAT:
            return (
                <ChatInput
                    content=""
                    isCentered={false}
                    agent={{ isRequesting: () => false }}
                    onRequest={() => {}}
                    setContent={() => {}}
                />
            );
        default:
            return <SearchInputArticles />;
    }
};

export const NavList = ({searchItem}: NavListProps) => {

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
                            <Link href="/smartcampus">文章推送</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                            <Link href="/smartcampus/chat">智能助手</Link>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                </NavigationMenuList>

            </NavigationMenu>
            {renderSearchComponent(searchItem)}
        </div>
    )
}