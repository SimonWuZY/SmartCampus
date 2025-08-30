import { getLLMConfig } from './env';

// LLM 服务配置
export interface LLMConfig {
  maxTokens: number;
  temperature: number;
  responseDelay: {
    min: number;
    max: number;
  };
  typingSpeed: number;
  enabled: boolean;
  debug: boolean;
}

export function getDefaultLLMConfig(): LLMConfig {
  const envConfig = getLLMConfig();
  
  return {
    maxTokens: envConfig.maxTokens,
    temperature: envConfig.temperature,
    responseDelay: {
      min: 500,
      max: 1500
    },
    typingSpeed: envConfig.typingSpeed,
    enabled: envConfig.enabled,
    debug: envConfig.debug
  };
}

// 知识库配置
export interface KnowledgeBase {
  topics: Record<string, string[]>;
  contexts: Record<string, string>;
}

export const knowledgeBase: KnowledgeBase = {
  topics: {
    programming: [
      "编程", "代码", "开发", "程序", "软件", "算法", "数据结构",
      "JavaScript", "TypeScript", "React", "Next.js", "Node.js"
    ],
    ai: [
      "人工智能", "AI", "机器学习", "深度学习", "神经网络", "LLM", "GPT"
    ],
    web: [
      "网站", "前端", "后端", "全栈", "HTML", "CSS", "数据库", "API"
    ],
    general: [
      "学习", "工作", "生活", "建议", "帮助", "问题", "解决"
    ]
  },
  contexts: {
    programming: `作为一个编程助手，我可以帮助你解决各种编程问题，包括：
- 代码调试和优化
- 技术选型建议
- 最佳实践指导
- 框架和库的使用
- 性能优化建议`,
    
    ai: `关于人工智能和机器学习，我可以为你提供：
- AI 技术概念解释
- 机器学习算法介绍
- 深度学习框架使用
- AI 应用场景分析
- 技术发展趋势讨论`,
    
    web: `在 Web 开发方面，我能够协助你：
- 前端技术栈选择
- 后端架构设计
- 数据库设计优化
- API 接口设计
- 性能和安全优化`,
    
    general: `我是你的智能助手，可以在以下方面为你提供帮助：
- 学习方法和计划制定
- 工作效率提升建议
- 问题分析和解决思路
- 日常生活建议
- 各类知识问答`
  }
};

// 话题检测函数
export function detectTopic(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  for (const [topic, keywords] of Object.entries(knowledgeBase.topics)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()))) {
      return topic;
    }
  }
  
  return 'general';
}