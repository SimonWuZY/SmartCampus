"use client";

import BottomNavBar from "@/components/bottom-narbar";
import { useXAgent, useXChat } from '@ant-design/x';
import { Flex } from 'antd';
import React, { useState, useEffect } from 'react';
import CenteredProps from "./center-props";
import ChatMessages from "./chat-message";
import ChatInput from "./chat-input";
import { ChatNavBar } from "./chat-navbar";

const ChatPage = () => {
    const [content, setContent] = useState('');
    const [isCentered, setIsCentered] = useState(true);

    // 模型输出函数
    const [agent] = useXAgent({
        request: async ({ message }, { onSuccess, onUpdate }) => {
            try {
                const response = await fetch('http://39.105.11.179:5000/chat/public', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: message }),
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                console.log(data);

                const fullContent = data.reply; // 确保访问的是 `reply` 字段
                let currentContent = '';

                const id = setInterval(() => {
                    currentContent = fullContent.slice(0, currentContent.length + 2);
                    onUpdate(currentContent);

                    if (currentContent === fullContent) {
                        clearInterval(id);
                        onSuccess(fullContent);
                    }
                }, 100);
            } catch (error) {
                console.error('Error fetching the response:', error);
                onSuccess('Error fetching the response');
            }
        },
    });

    // Chat messages
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
            <div>
                <ChatNavBar />
            </div>
            <Flex vertical gap="middle" className={`flex-1 ${isCentered ? 'justify-center' : 'justify-start'}`}>
                {isCentered && <CenteredProps onPromptClick={handlePromptClick} />}
                {/* 条件渲染 CenteredMessage 组件 */}
                {!isCentered && <ChatMessages messages={messages} />}
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