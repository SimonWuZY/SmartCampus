"use client";
import Link from "next/link";
import Image from "next/image";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { SearchInputArticles } from "@/app/smartcampus/(home)/search-input-articles";
import { useIsMobile } from "@/hooks/use-mobile";
import { NavList } from "@/components/navList";
import { NavListProps } from "@/constants/interfaces";

const RootNavBar = ({searchItem}: NavListProps) => {
    const isMobile = useIsMobile();
    if (isMobile) {
        return (
            <div className="flex items-center justify-between h-full w-full">
                <SearchInputArticles />
                <div className="flex gap-3 items-center pl-6">
                    <UserButton />
                </div>
                {/* 标签 */}
            </div>);
    }

    return (
        <nav className="flex items-center justify-between h-full w-full">
            <div className="flex gap-3 items-center shrink-0 pr-6">
                <Link href="/">
                    <Image src="/logo.svg" alt="Logo" width={64} height={64} />
                </Link>
                <h3 className="text-xl">智合校园</h3>
            </div>
            <div className="w-full mx-8">
                <NavList searchItem={searchItem}></NavList>
            </div>

            <div className="flex gap-3 items-center pl-6">
                <OrganizationSwitcher
                    afterCreateOrganizationUrl="/"
                    afterLeaveOrganizationUrl="/"
                    afterSelectOrganizationUrl="/"
                    afterSelectPersonalUrl="/"
                />
                <UserButton />
            </div>
        </nav>);
}
export default RootNavBar;