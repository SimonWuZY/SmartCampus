"use client";

import React from "react";
import { Button, Drawer, Typography } from "antd";
import { PlusOutlined, MenuOutlined } from "@ant-design/icons";
import { Conversations } from "@ant-design/x";
import type { Conversation } from "@ant-design/x/es/conversations/interface";
import type { Id } from "../../../../convex/_generated/dataModel";

export type ChatConversationRow = {
    _id: Id<"chatConversations">;
    title: string;
    updatedAt: number;
};

type ChatHistorySidebarProps = {
    conversations: ChatConversationRow[] | undefined;
    activeConversationId: Id<"chatConversations"> | null;
    onSelect: (id: Id<"chatConversations">) => void;
    onNewChat: () => void;
    onDelete: (id: Id<"chatConversations">) => void;
};

function toConversationItems(rows: ChatConversationRow[]): Conversation[] {
    return rows.map((c) => ({
        key: c._id,
        label: (
            <span className="truncate block max-w-[200px]" title={c.title}>
                {c.title}
            </span>
        ),
        timestamp: c.updatedAt,
        group: "历史会话",
    }));
}

export function ChatHistorySidebar({
    conversations,
    activeConversationId,
    onSelect,
    onNewChat,
    onDelete,
}: ChatHistorySidebarProps) {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const items = React.useMemo(
        () => (conversations?.length ? toConversationItems(conversations) : []),
        [conversations]
    );

    const sidebarInner = (
        <div className="flex flex-col h-full min-h-0 bg-neutral-50">
            <div className="p-3 border-b border-neutral-200 shrink-0">
                <Button type="primary" icon={<PlusOutlined />} block onClick={onNewChat}>
                    新对话
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 p-2">
                {items.length === 0 ? (
                    <Typography.Text type="secondary" className="block px-2 py-4 text-sm">
                        暂无历史，开始新对话后会自动保存。
                    </Typography.Text>
                ) : (
                    <Conversations
                        items={items}
                        activeKey={activeConversationId ?? undefined}
                        onActiveChange={(key) => {
                            onSelect(key as Id<"chatConversations">);
                            setMobileOpen(false);
                        }}
                        menu={(conv) => ({
                            items: [{ key: "delete", label: "删除会话", danger: true }],
                            onClick: ({ key, domEvent }) => {
                                domEvent?.stopPropagation();
                                if (key === "delete") {
                                    onDelete(conv.key as Id<"chatConversations">);
                                    setMobileOpen(false);
                                }
                            },
                        })}
                    />
                )}
            </div>
        </div>
    );

    return (
        <>
            <div className="hidden md:flex w-[280px] shrink-0 border-r border-neutral-200 flex-col h-full">
                {sidebarInner}
            </div>
            <div className="md:hidden fixed bottom-20 left-3 z-20">
                <Button
                    type="default"
                    shape="circle"
                    icon={<MenuOutlined />}
                    onClick={() => setMobileOpen(true)}
                    aria-label="历史会话"
                />
            </div>
            <Drawer
                title="历史会话"
                placement="left"
                width={280}
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                styles={{ body: { padding: 0 } }}
            >
                <div className="h-[calc(100vh-120px)]">{sidebarInner}</div>
            </Drawer>
        </>
    );
}
