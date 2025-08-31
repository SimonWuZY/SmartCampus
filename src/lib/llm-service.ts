import { getDefaultLLMConfig, knowledgeBase, detectTopic } from './llm-config';
import { debugLog } from './env';
import { DeepSeekProvider, createDeepSeekConfig } from './ai-providers-simple';

// 对话历史接口
export interface ConversationEntry {
  id: string;
  query: string;
  reply: string;
  topic: string;
  confidence: number;
  timestamp: string;
}

// LLM 响应接口
export interface LLMResponse {
  reply: string;
  topic: string;
  confidence: number;
  processingTime: number;
}

// 增强的本地 LLM 服务管理器
export class LocalLLMService {
  private conversationHistory: ConversationEntry[] = [];
  private requestCount = 0;
  private aiProvider: DeepSeekProvider | null = null;

  private responses: Record<string, string[]> = {
    greeting: [
      "你好！我是你的智能助手，专注于为你提供高质量的问答服务。有什么我可以帮助你的吗？",
      "欢迎使用智能助手！我在这里为你解答各种问题，提供专业建议。",
      "你好！很高兴为你服务。请告诉我你需要什么帮助，我会尽我所能为你解答。"
    ],
    programming: [
      "这是一个很好的编程问题！让我为你详细分析...",
      "在编程领域，这个问题确实值得深入探讨...",
      "作为你的编程助手，我来帮你解决这个技术问题..."
    ],
    ai: [
      "人工智能是一个fascinating的领域！关于你的问题...",
      "在AI和机器学习方面，我可以为你提供以下见解...",
      "这是一个很有前瞻性的AI问题，让我来分析一下..."
    ],
    web: [
      "Web开发是我的专长之一！针对你的问题...",
      "在现代Web开发中，这确实是一个重要的考虑因素...",
      "让我从全栈开发的角度来回答你的问题..."
    ],
    general: [
      "这是一个很有意思的问题，让我来为你分析...",
      "基于我的理解，我认为可以从以下几个方面来看这个问题...",
      "感谢你的提问！我来为你提供一些有用的见解..."
    ]
  };

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeAIProvider(): void {
    if (!this.aiProvider) {
      try {
        const config = createDeepSeekConfig();
        this.aiProvider = new DeepSeekProvider(config);
        debugLog('DeepSeek provider initialized', { model: config.model });
      } catch (error) {
        debugLog('Failed to initialize DeepSeek provider', error);
        throw new Error(`DeepSeek provider initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private buildSystemPrompt(topic: string): string {
    const basePrompt = `你是一个专业的AI助手，专注于提供高质量、准确、有用的回答。

当前对话主题: ${topic}

请遵循以下原则:
1. 提供准确、有用的信息
2. 保持友好和专业的语调
3. 根据问题的复杂程度调整回答的详细程度
4. 如果不确定答案，请诚实说明
5. 使用中文回答，除非用户特别要求其他语言

${knowledgeBase.contexts[topic] || knowledgeBase.contexts.general}`;

    return basePrompt;
  }

  private async generateAIResponse(query: string, topic: string): Promise<string> {
    this.initializeAIProvider();

    if (!this.aiProvider) {
      throw new Error('AI provider not available');
    }

    const systemPrompt = this.buildSystemPrompt(topic);

    // 构建对话历史（最近5条）
    const recentHistory = this.conversationHistory.slice(-5);
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加历史对话
    for (const entry of recentHistory) {
      messages.push(
        { role: 'user', content: entry.query },
        { role: 'assistant', content: entry.reply }
      );
    }

    // 添加当前问题
    messages.push({ role: 'user', content: query });

    debugLog('Generating AI response', {
      topic,
      messageCount: messages.length,
      query: query.substring(0, 100)
    });

    const response = await this.aiProvider.generateResponse(messages);

    debugLog('AI response generated', {
      contentLength: response.content.length,
      usage: response.usage,
      model: response.model
    });

    return response.content;
  }

  private getDetailedResponse(query: string, topic: string): string {
    const responses = this.responses[topic] || this.responses.general;
    const baseResponse = responses[Math.floor(Math.random() * responses.length)];
    const contextInfo = knowledgeBase.contexts[topic] || knowledgeBase.contexts.general;

    let detailedResponse = baseResponse;

    if (query.length > 20) {
      detailedResponse += `\n\n${contextInfo}\n\n`;

      // 根据问题类型提供具体建议
      if (query.includes('如何') || query.includes('怎么')) {
        detailedResponse += `针对"${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"这个问题，我建议采用以下步骤：\n\n`;
        detailedResponse += `1. **分析需求**: 首先明确你想要达到的目标\n`;
        detailedResponse += `2. **制定计划**: 将大问题分解为小的可执行步骤\n`;
        detailedResponse += `3. **实施方案**: 逐步执行并监控进展\n`;
        detailedResponse += `4. **优化改进**: 根据结果调整和优化方案\n\n`;
      } else if (query.includes('什么') || query.includes('是什么')) {
        detailedResponse += `关于你询问的概念，让我为你详细解释：\n\n`;
        detailedResponse += `这个问题涉及到多个方面的知识，我会尽量用通俗易懂的方式来说明。\n\n`;
      } else if (query.includes('比较') || query.includes('区别')) {
        detailedResponse += `让我为你详细比较这些概念的异同：\n\n`;
        detailedResponse += `我会从多个维度来分析，帮助你更好地理解它们的特点和适用场景。\n\n`;
      }

      detailedResponse += `如果你需要更具体的指导或有其他相关问题，请随时告诉我！我会根据你的具体情况提供更有针对性的建议。`;
    }

    return detailedResponse;
  }

  private calculateConfidence(query: string, topic: string): number {
    const keywords = knowledgeBase.topics[topic] || [];
    const lowerQuery = query.toLowerCase();
    const matchCount = keywords.filter(keyword =>
      lowerQuery.includes(keyword.toLowerCase())
    ).length;

    // 基础置信度 + 关键词匹配加成
    const baseConfidence = 0.3;
    const keywordBonus = matchCount * 0.15;
    const lengthBonus = Math.min(0.2, query.length / 500); // 长问题通常更具体

    return Math.min(0.95, baseConfidence + keywordBonus + lengthBonus);
  }

  async processQuery(query: string): Promise<LLMResponse> {
    const startTime = Date.now();
    const config = getDefaultLLMConfig();

    // 检查服务是否启用
    if (!config.enabled) {
      throw new Error('LLM service is disabled');
    }

    this.requestCount++;
    debugLog('Processing query', {
      requestId: this.requestCount,
      query: query.substring(0, 50),
      config: {
        enabled: config.enabled,
        maxTokens: config.maxTokens,
        temperature: config.temperature
      }
    });

    // 模拟真实的处理延迟
    const delay = config.responseDelay.min +
      Math.random() * (config.responseDelay.max - config.responseDelay.min);
    await new Promise(resolve => setTimeout(resolve, delay));

    if (!query || query.trim().length === 0) {
      const processingTime = Date.now() - startTime;
      return {
        reply: "请输入你的问题，我会尽力为你解答。你可以问我关于编程、AI、Web开发或其他任何你感兴趣的话题。",
        topic: 'general',
        confidence: 1.0,
        processingTime
      };
    }

    const topic = detectTopic(query);
    const confidence = this.calculateConfidence(query, topic);

    // 使用真实的 AI 生成回答
    let reply: string;
    try {
      reply = await this.generateAIResponse(query, topic);
    } catch (aiError) {
      debugLog('AI generation failed, falling back to template', aiError instanceof Error ? aiError : String(aiError));
      // 如果 AI 调用失败，回退到模板回答
      reply = this.getDetailedResponse(query, topic);
    }

    const processingTime = Date.now() - startTime;

    // 保存对话历史
    const conversationEntry: ConversationEntry = {
      id: this.generateId(),
      query,
      reply,
      topic,
      confidence,
      timestamp: new Date().toISOString()
    };

    this.conversationHistory.push(conversationEntry);

    // 限制历史记录长度
    if (this.conversationHistory.length > 100) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }

    debugLog('Query processed successfully', {
      requestId: this.requestCount,
      topic,
      confidence,
      replyLength: reply.length,
      processingTime
    });

    return { reply, topic, confidence, processingTime };
  }

  getConversationHistory(): ConversationEntry[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
    debugLog('Conversation history cleared');
  }

  getStats() {
    const topicCounts = this.conversationHistory.reduce((acc, entry) => {
      acc[entry.topic] = (acc[entry.topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgConfidence = this.conversationHistory.length > 0
      ? this.conversationHistory.reduce((sum, entry) => sum + entry.confidence, 0) / this.conversationHistory.length
      : 0;

    return {
      totalRequests: this.requestCount,
      conversationCount: this.conversationHistory.length,
      topicDistribution: topicCounts,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      lastActivity: this.conversationHistory.length > 0
        ? this.conversationHistory[this.conversationHistory.length - 1].timestamp
        : null
    };
  }
}

// 单例实例
export const llmService = new LocalLLMService();