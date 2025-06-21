"use-client";
import Link from "next/link";
import Image from "next/image";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { SearchInput } from "./search-input";
import { useIsMobile } from "@/hooks/use-mobile";

export const Navbar = () => {
    const isMobile = useIsMobile();
    return (

        <nav className="flex items-center justify-between h-full w-full">
            {!isMobile && (<div className="flex gap-3 items-center shrink-0 pr-6">
                <Link href="/">
                    <Image src="/logo.svg" alt="Logo" width={64} height={64} />
                </Link>
            </div>)}
            <SearchInput />
            <div className="flex gap-3 items-center pl-6">
                {!isMobile && (<OrganizationSwitcher
                    afterCreateOrganizationUrl="/"
                    afterLeaveOrganizationUrl="/"
                    afterSelectOrganizationUrl="/"
                    afterSelectPersonalUrl="/"
                />)}
                <UserButton />
            </div>
        </nav>
    )
}