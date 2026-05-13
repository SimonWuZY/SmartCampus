"use client";
import Link from "next/link";
import Image from "next/image";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { useIsMobile } from "@/hooks/use-mobile";
import { NavList, NavSearchSlot } from "@/components/navList";
import { NavListProps } from "@/constants/interfaces";

const RootNavBar = ({searchItem}: NavListProps) => {
    const isMobile = useIsMobile();
    if (isMobile) {
        return (
            <div className="flex items-center justify-between h-full w-full">
                <div className="min-w-0 flex-1 mr-2">
                    <NavSearchSlot searchItem={searchItem} />
                </div>
                <div className="flex gap-3 items-center pl-6 shrink-0">
                    <UserButton />
                </div>
                {/* 标签 */}
            </div>
        );
    }

    return (
        <nav className="flex items-center justify-between h-full w-full">
            <div className="flex gap-3 items-center shrink-0 pr-6">
                <Link href="/smartcampus/chat">
                    <Image src="/logo.svg" alt="Logo" width={64} height={64} />
                </Link>
                <h3 className="text-xl">智合校园</h3>
            </div>
            <div className="w-full mx-8">
                <NavList searchItem={searchItem}></NavList>
            </div>

            <div className="flex gap-3 items-center pl-6">
                <OrganizationSwitcher
                    afterCreateOrganizationUrl="/smartcampus/chat"
                    afterLeaveOrganizationUrl="/smartcampus/chat"
                    afterSelectOrganizationUrl="/smartcampus/chat"
                    afterSelectPersonalUrl="/smartcampus/chat"
                />
                <UserButton />
            </div>
        </nav>);
}
export default RootNavBar;