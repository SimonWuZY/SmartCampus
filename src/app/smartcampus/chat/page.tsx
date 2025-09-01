"use client";

import BottomNavBar from "@/components/bottom-narbar";
import { useXAgent, useXChat } from '@ant-design/x';
import { Flex } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import CenteredProps from "./center-props";
import EnhancedChatMessages from "@/components/enhanced-chat-message";
import ChatInput from "./chat-input";
// import { ChatNavBar } from "./chat-navbar";
import { NavListEnum } from "@/constants/interfaces";
import RootNavBar from "@/components/rootNavbar";

const ChatPage = () => {
    const [content, setContent] = useState('');
    const [isCentered, setIsCentered] = useState(true);
    
    // 当前消息内容引用
    const currentMessageRef = useRef<string>('');

    // 获取基础 URL
    const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    };

    // 本地 LLM 服务 - 使用 SSE 流式传输
    const [agent] = useXAgent({
        request: async ({ message }, { onSuccess, onUpdate, onError }) => {
            try {
                // 重置当前消息
                currentMessageRef.current = '';

                // 发送 POST 请求到流式端点
                const response = await fetch(`${getBaseUrl()}/api/chat-stream`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: message })
                });

                if (!response.ok) {
                    throw new Error(`服务响应错误: ${response.status}`);
                }

                // 处理流式响应
                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) {
                    throw new Error('无法获取响应流');
                }

                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                
                                switch (data.type) {
                                    case 'start':
                                        currentMessageRef.current = '';
                                        break;
                                        
                                    case 'chunk':
                                        if (data.content) {
                                            currentMessageRef.current += data.content;
                                            onUpdate(currentMessageRef.current);
                                        }
                                        break;
                                        
                                    case 'end':
                                        console.log('LLM 流式响应完成:', {
                                            topic: data.metadata?.topic,
                                            confidence: data.metadata?.confidence,
                                            processingTime: data.metadata?.processingTime
                                        });
                                        onSuccess(currentMessageRef.current);
                                        return; // 完成，退出函数
                                        
                                    case 'error':
                                        throw new Error(data.content || '服务器错误');
                                }
                            } catch (parseError) {
                                console.error('解析 SSE 数据失败:', parseError);
                            }
                        }
                    }
                }

            } catch (error) {
                console.error('SSE 流式传输错误:', error);
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