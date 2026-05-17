"use client";

import BottomNavBar from "@/components/bottom-narbar";
import { useXAgent, useXChat } from "@ant-design/x";
import { Flex } from "antd";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import CenteredProps from "./center-props";
import ChatMessages from "./chat-message";
import ChatInput from "./chat-input";
import { NavListEnum } from "@/constants/interfaces";
import RootNavBar from "@/components/rootNavbar";
import { ChatHistorySidebar } from "./chat-history-sidebar";

type SseEvent =
    | { type: "meta"; route: string }
    | { type: "search"; phase: string; [k: string]: unknown }
    | { type: "documents"; ids: string[] }
    | { type: "delta"; text: string }
    | { type: "done" }
    | { type: "error"; message: string };

function parseSseBuffer(buffer: string): { events: SseEvent[]; rest: string } {
    const events: SseEvent[] = [];
    const parts = buffer.split("\n\n");
    const rest = parts.pop() ?? "";
    for (const block of parts) {
        const line = block.trim().split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        const json = line.slice(5).trim();
        if (!json) continue;
        try {
            events.push(JSON.parse(json) as SseEvent);
        } catch {
            // ignore
        }
    }
    return { events, rest };
}

const ChatPage = () => {
    const [content, setContent] = useState("");
    const [isCentered, setIsCentered] = useState(true);
    const [activeConversationId, setActiveConversationId] =
        useState<Id<"chatConversations"> | null>(null);
    const conversationIdRef = useRef<Id<"chatConversations"> | null>(null);

    const conversations = useQuery(api.chat.listChatConversations, { limit: 50 });
    const messagesData = useQuery(
        api.chat.listChatMessages,
        activeConversationId ? { conversationId: activeConversationId } : "skip"
    );

    const createConversation = useMutation(api.chat.createChatConversation);
    const appendMessage = useMutation(api.chat.appendChatMessage);
    const deleteConversation = useMutation(api.chat.deleteChatConversation);

    useEffect(() => {
        conversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    const [agent] = useXAgent({
        request: async ({ message }, { onSuccess, onUpdate }) => {
            const userText = typeof message === "string" ? message : String(message ?? "");
            let assembled = "";
            try {
                let cid = conversationIdRef.current;
                if (!cid) {
                    cid = await createConversation({
                        title: userText.trim().slice(0, 80) || "新对话",
                    });
                    conversationIdRef.current = cid;
                    setActiveConversationId(cid);
                }

                await appendMessage({
                    conversationId: cid,
                    role: "user",
                    content: userText,
                });

                const response = await fetch("/api/chat/stream", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ message: userText }),
                });

                if (!response.ok) {
                    const errText = await response.text().catch(() => "");
                    throw new Error(errText || `HTTP ${response.status}`);
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error("No response body");
                }

                const decoder = new TextDecoder();
                let carry = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    carry += decoder.decode(value, { stream: true });
                    const { events, rest } = parseSseBuffer(carry);
                    carry = rest;
                    for (const ev of events) {
                        if (ev.type === "delta" && ev.text) {
                            assembled += ev.text;
                            onUpdate(assembled);
                        }
                        if (ev.type === "error") {
                            throw new Error(ev.message);
                        }
                    }
                }

                const { events: tailEvents } = parseSseBuffer(`${carry}\n\n`);
                for (const ev of tailEvents) {
                    if (ev.type === "delta" && ev.text) {
                        assembled += ev.text;
                        onUpdate(assembled);
                    }
                    if (ev.type === "error") {
                        throw new Error(ev.message);
                    }
                }

                if (!assembled.trim()) {
                    assembled = "_（未收到模型输出，请检查 DEEPSEEK_API_KEY 与网络）_";
                }

                await appendMessage({
                    conversationId: cid,
                    role: "assistant",
                    content: assembled,
                });

                onSuccess(assembled);
            } catch (error) {
                console.error("Chat stream error:", error);
                const msg =
                    error instanceof Error ? error.message : "请求失败，请稍后重试。";
                onSuccess(`**出错**\n\n${msg}`);
            }
        },
    });

    const { onRequest, messages, setMessages } = useXChat({
        agent,
    });

    const isRequesting = agent.isRequesting();

    useEffect(() => {
        if (isRequesting) return;
        if (!activeConversationId) return;
        if (messagesData === undefined) return;
        setMessages(
            messagesData.map((m) => ({
                id: m._id,
                message: m.content,
                status: "success" as const,
            }))
        );
    }, [activeConversationId, messagesData, isRequesting, setMessages]);

    useEffect(() => {
        if (content.length > 0) {
            setIsCentered(false);
        }
    }, [content]);

    const handlePromptClick = (promptContent: string) => {
        setContent(promptContent);
        setIsCentered(false);
        onRequest(promptContent);
    };

    const handleNewChat = useCallback(() => {
        setActiveConversationId(null);
        conversationIdRef.current = null;
        setMessages([]);
        setContent("");
        setIsCentered(true);
    }, [setMessages]);

    const handleSelectConversation = useCallback((id: Id<"chatConversations">) => {
        setActiveConversationId(id);
        conversationIdRef.current = id;
        setIsCentered(false);
    }, []);

    const handleDeleteConversation = useCallback(
        async (id: Id<"chatConversations">) => {
            await deleteConversation({ conversationId: id });
            if (activeConversationId === id) {
                handleNewChat();
            }
        },
        [deleteConversation, activeConversationId, handleNewChat]
    );

    return (
        <div className="h-screen flex flex-col">
            <div className="fixed top-0 left-0 right-0 z-10 h-16 bg-white p-4">
                <RootNavBar searchItem={NavListEnum.CHAT}></RootNavBar>
            </div>
            <div className="flex flex-1 mt-16 overflow-hidden min-h-0">
                <ChatHistorySidebar
                    conversations={conversations ?? undefined}
                    activeConversationId={activeConversationId}
                    onSelect={handleSelectConversation}
                    onNewChat={handleNewChat}
                    onDelete={handleDeleteConversation}
                />
                <Flex
                    vertical
                    gap="middle"
                    className={`flex-1 min-w-0 min-h-0 overflow-hidden ${
                        isCentered ? "justify-center" : "justify-start"
                    }`}
                >
                    {isCentered && <CenteredProps onPromptClick={handlePromptClick} />}
                    {!isCentered && (
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <ChatMessages messages={messages} />
                        </div>
                    )}
                    <ChatInput
                        content={content}
                        isCentered={isCentered}
                        agent={agent}
                        onRequest={onRequest}
                        setContent={setContent}
                    />
                </Flex>
            </div>
            <BottomNavBar />
        </div>
    );
};

export default ChatPage;
