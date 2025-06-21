import { UserButton } from "@clerk/nextjs";
import HistoryDropdown from "./history-dropdown"; // 导入历史记录下拉菜单组件

const historyItems = [
    "历史记录 1",
    "历史记录 2",
    "历史记录 3",
    "历史记录 4",
    "历史记录 5",
];

export const ChatNavBar = () => {
    return (
        <div className="flex items-center justify-between w-full border-b border-gray-300 py-2">
            <div className="flex items-center gap-4">
                <HistoryDropdown historyItems={historyItems} />
            </div>
            <div className="flex gap-3 items-center shrink-0 pr-6">
                <UserButton />
            </div>
        </div>
    );
};