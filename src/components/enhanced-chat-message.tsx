/**
 * 增强的聊天消息组件 - 支持文章推荐显示
 */

"use client";

import React from 'react';
import { Bubble } from '@ant-design/x';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { type GetProp } from 'antd';
import ArticleRecommendation, { ArticleRecommendationItem } from './article-recommendation';
import ReactMarkdown from 'react-markdown';

// 消息类型接口
interface EnhancedMessage {
  id: string | number;
  message: string;
  status: 'local' | 'success' | 'error' | 'pending' | 'loading';
  articleRecommendations?: ArticleRecommendationItem[];
}

const roles: GetProp<typeof Bubble.List, 'roles'> = {
  ai: {
    placement: 'start',
    avatar: { 
      icon: <RobotOutlined />, 
      style: { background: '#e6f4ff', color: '#1890ff' } 
    },
  },
  local: {
    placement: 'end',
    avatar: { 
      icon: <UserOutlined />, 
      style: { background: '#f6ffed', color: '#52c41a' } 
    },
  },
};

// 解析消息中的文章推荐信息
const parseArticleRecommendations = (content: string): {
  cleanContent: string;
  recommendations: ArticleRecommendationItem[];
} => {
  // 查找文章推荐部分的正则表达式
  const recommendationRegex = /📚\s*\*\*相关文章推荐\*\*：\n\n([\s\S]*?)(?:\n\n|$)/;
  const match = content.match(recommendationRegex);
  
  if (!match) {
    return { cleanContent: content, recommendations: [] };
  }

  // 移除推荐部分，保留主要回答
  const cleanContent = content.replace(recommendationRegex, '').trim();
  
  // 解析推荐文章（这里简化处理，实际项目中可能需要更复杂的解析）
  const recommendationText = match[1];
  const recommendations: ArticleRecommendationItem[] = [];
  
  // 简单的文章信息提取（基于格式化的文本）
  const articleMatches = recommendationText.matchAll(/\d+\.\s*\*\*(.*?)\*\*\n.*?📝\s*(.*?)\n.*?👤\s*作者：(.*?)\n.*?🎯\s*匹配关键词：(.*?)\n.*?📊\s*相关度：(\d+)%\n.*?🔗\s*\[.*?\]\((.*?)\)/g);
  
  for (const articleMatch of articleMatches) {
    const [, title, label, author, keywords, relevance, url] = articleMatch;
    const articleId = url.split('/').pop() || '';
    
    if (title && articleId) {
      recommendations.push({
        article: {
          id: articleId,
          title: title.trim(),
          introduction: {
            author: author.trim(),
            label: label.trim(),
            data: '',
            likeNumber: 0,
            commentNumber: 0,
          },
          content: '',
        },
        relevanceScore: parseInt(relevance) / 100,
        matchedKeywords: keywords.split(',').map(k => k.trim()),
      });
    }
  }

  return { cleanContent, recommendations };
};

// 自定义消息内容渲染器
const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  const { cleanContent, recommendations } = parseArticleRecommendations(content);

  return (
    <div className="space-y-4">
      {/* 主要消息内容 */}
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          components={{
            // 自定义链接样式
            a: ({ href, children }) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {children}
              </a>
            ),
            // 自定义代码块样式
            code: ({ children, className }) => (
              <code className={`bg-gray-100 px-1 py-0.5 rounded text-sm ${className || ''}`}>
                {children}
              </code>
            ),
            // 自定义预格式化文本样式
            pre: ({ children }) => (
              <pre className="bg-gray-50 p-3 rounded-lg overflow-x-auto text-sm">
                {children}
              </pre>
            ),
          }}
        >
          {cleanContent}
        </ReactMarkdown>
      </div>

      {/* 文章推荐 */}
      {recommendations.length > 0 && (
        <ArticleRecommendation 
          recommendations={recommendations}
          className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
        />
      )}
    </div>
  );
};

// 主要的增强聊天消息组件
const EnhancedChatMessages: React.FC<{ messages: EnhancedMessage[] }> = ({ messages }) => {
  return (
    <Bubble.List
      roles={roles}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      items={messages.map(({ id, message, status }) => ({
        key: String(id),
        role: status === 'local' ? 'local' : 'ai',
        content: status === 'local' ? (
          <div className="text-gray-800">{message}</div>
        ) : (
          <MessageContent content={message} />
        ),
      }))}
    />
  );
};

export default EnhancedChatMessages;