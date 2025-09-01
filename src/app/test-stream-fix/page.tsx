"use client";

import React, { useState } from 'react';

export default function TestStreamFixPage() {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testStreamChat = async () => {
    setIsLoading(true);
    setCurrentMessage('');
    setMessages(prev => [...prev, '用户: 请你为我检索一下所有可能的高等数学学习笔记']);

    try {
      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: '请你为我检索一下所有可能的高等数学学习笔记' 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullMessage = '';

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
                case 'chunk':
                  if (data.content) {
                    fullMessage += data.content;
                    setCurrentMessage(fullMessage);
                  }
                  break;
                  
                case 'end':
                  setMessages(prev => [...prev, `助手: ${fullMessage}`]);
                  setCurrentMessage('');
                  setIsLoading(false);
                  return;
                  
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
      console.error('测试流式聊天失败:', error);
      setMessages(prev => [...prev, `错误: ${error instanceof Error ? error.message : '未知错误'}`]);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          🔧 流式传输修复测试
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试说明</h2>
          <p className="text-gray-600 mb-4">
            此页面用于测试修复后的流式传输功能，检查是否还有中文乱码和 Markdown 格式问题。
          </p>
          
          <button
            onClick={testStreamChat}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? '测试中...' : '开始测试'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">对话记录</h2>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                <pre className="whitespace-pre-wrap font-sans text-sm">{msg}</pre>
              </div>
            ))}
            
            {currentMessage && (
              <div className="p-3 bg-blue-50 rounded border-l-4 border-green-500">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-green-600">助手 (实时):</span>
                  <div className="animate-pulse w-2 h-4 bg-green-500 rounded"></div>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm mt-2">{currentMessage}</pre>
              </div>
            )}
          </div>
          
          {messages.length === 0 && !isLoading && (
            <p className="text-gray-500 text-center py-8">
              点击 开始测试 按钮来测试流式传输功能
            </p>
          )}
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 观察输出是否有乱码、格式是否正确、流式效果是否流畅</p>
        </div>
      </div>
    </div>
  );
}