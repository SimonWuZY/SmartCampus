"use client";

import BottomNavBar from "@/components/bottom-narbar";
import { useXAgent, useXChat } from '@ant-design/x';
import { Flex } from 'antd';
import React, { useState, useEffect } from 'react';
import CenteredProps from "./center-props";
import EnhancedChatMessages from "@/components/enhanced-chat-message";
import ChatInput from "./chat-input";
// import { ChatNavBar } from "./chat-navbar";
import { NavListEnum } from "@/constants/interfaces";
import RootNavBar from "@/components/rootNavbar";

const ChatPage = () => {
    const [content, setContent] = useState('');
    const [isCentered, setIsCentered] = useState(true);

    // 本地 LLM 服务
    const [agent] = useXAgent({
        request: async ({ message }, { onSuccess, onUpdate, onError }) => {
            try {
                // 使用本地 Next.js API 路由
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: message }),
                });

                if (!response.ok) {
                    throw new Error(`服务响应错误: ${response.status}`);
                }

                const data = await response.json();
                console.log('LLM 响应:', {
                    topic: data.topic,
                    confidence: data.confidence,
                    timestamp: data.timestamp
                });

                const fullContent = data.reply;
                let currentContent = '';

                // 优化的打字机效果
                const typingSpeed = 30; // 更快的打字速度
                const charsPerStep = Math.max(1, Math.floor(fullContent.length / 100)); // 动态调整每步字符数

                const id = setInterval(() => {
                    const nextLength = Math.min(
                        fullContent.length,
                        currentContent.length + charsPerStep
                    );
                    currentContent = fullContent.slice(0, nextLength);
                    onUpdate(currentContent);

                    if (currentContent === fullContent) {
                        clearInterval(id);
                        onSuccess(fullContent);
                    }
                }, typingSpeed);

            } catch (error) {
                console.error('本地 LLM 服务错误:', error);
                const errorMessage = error instanceof Error
                    ? `服务错误: ${error.message}`
                    : '抱歉，服务暂时不可用，请稍后再试。';

                if (onError) {
                    onError(new Error(errorMessage));
                } else {
                    onSuccess(errorMessage);
                }
            }
        },
    });

    const { onRequest, messages } = useXChat({
        agent,
    });

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

    return (
        <div className="h-screen flex flex-col">
            <div className="fixed top-0 left-0 right-0 z-10 h-16 bg-white p-4 shadow-md">
                <RootNavBar searchItem={NavListEnum.CHAT}></RootNavBar>
            </div>
            <Flex vertical gap="middle" className={`flex-1 ${isCentered ? 'justify-center' : 'justify-start'}`}>
                {isCentered && <CenteredProps onPromptClick={handlePromptClick} />}
                {/* 条件渲染 CenteredMessage 组件 */}
                {!isCentered && <EnhancedChatMessages messages={messages} />}
                <ChatInput
                    content={content}
                    isCentered={isCentered}
                    agent={agent}
                    onRequest={onRequest}
                    setContent={setContent}
                />
            </Flex>
            <BottomNavBar />
        </div>
    );
};

export default ChatPage;