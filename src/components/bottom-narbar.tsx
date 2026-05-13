"use client"
import { useEffect, useState } from "react";
import { Home, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLoading } from "./loading";

const BottomNavBar = () => {
    const isMobile = useIsMobile();
    const [currentPath, setCurrentPath] = useState("");
    const pathname = usePathname();
    const { setLoading } = useLoading();

    useEffect(() => {
        if (typeof window !== "undefined") {
            setLoading(true); // 开始加载动画
            setCurrentPath(pathname);
            setLoading(false); // 停止加载动画
        }
    }, [pathname, setLoading]);

    const navItems = [
        { title: "文档", href: "/smartcampus/documents", icon: FileText },
        { title: "对话", href: "/smartcampus/chat", icon: Home },
    ];

    return (
        isMobile && (<div className="fixed bottom-0 left-0 right-0 z-10 h-16 bg-white flex justify-around items-center border-t border-gray-200">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                    item.href === "/smartcampus/chat"
                        ? currentPath.startsWith("/smartcampus/chat")
                        : currentPath.startsWith(item.href);
                return (
                    <Link key={item.title} href={item.href} passHref>
                        <div className={`flex flex-col items-center ${isActive ? 'text-blue-500' : 'text-gray-500'}`}>
                            <Icon className="h-6 w-6" />
                            <span className="text-xs">{item.title}</span>
                        </div>
                    </Link>
                );
            })}
        </div>)
    );
};

export default BottomNavBar;