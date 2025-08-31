import { getDefaultLLMConfig, knowledgeBase, detectTopic } from './llm-config';
import { debugLog } from './env';
import { DeepSeekProvider, createDeepSeekConfig } from './ai-providers-simple';
import { ArticleSearchTool, ArticleSearchResult } from './article-search-tool';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import { ArticleProps } from '@/constants/interfaces';

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
  private articleSearchTool: ArticleSearchTool = new ArticleSearchTool();

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
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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

  private buildSystemPrompt(topic: string, hasArticleRecommendations: boolean = false): string {
    const basePrompt = `你是一个专业的AI助手，专注于提供高质量、准确、有用的回答。

当前对话主题: ${topic}

请遵循以下原则:
1. 提供准确、有用的信息
2. 保持友好和专业的语调
3. 根据问题的复杂程度调整回答的详细程度
4. 如果不确定答案，请诚实说明
5. 使用中文回答，除非用户特别要求其他语言
${hasArticleRecommendations ? '6. 当我为你提供相关文章推荐时，请在回答中自然地引用这些文章，并鼓励用户查看' : ''}

${knowledgeBase.contexts[topic] || knowledgeBase.contexts.general}`;

    return basePrompt;
  }

  // 直接从Convex获取文章数据
  private async getArticlesFromConvex(): Promise<ArticleProps[]> {
    try {
      if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
        console.error('[LLMService] Convex URL not configured');
        return [];
      }

      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
      const articles = await convex.query(api.articles.getAllArticles);
      
      console.log('[LLMService] 直接从Convex获取文章:', {
        count: articles?.length || 0,
        articles: articles?.map(a => ({ id: a.id, title: a.title })) || []
      });
      
      return articles || [];
    } catch (error) {
      console.error('[LLMService] 从Convex获取文章失败:', error);
      return [];
    }
  }

  // 搜索相关文章
  private async searchRelevantArticles(query: string): Promise<ArticleSearchResult[]> {
    console.log('[LLMService] 开始文章检索流程', { query: query.substring(0, 100) });
    
    try {
      // 检查是否需要搜索文章
      const shouldSearch = this.articleSearchTool.shouldSearchArticles(query);
      console.log('[LLMService] 检查是否需要搜索文章:', { shouldSearch, query: query.substring(0, 50) });
      
      // 开发环境调试模式 - 总是尝试搜索
      const isDevelopment = process.env.NODE_ENV === 'development';
      const debugMode = process.env.DEBUG_LLM === 'true';
      
      // 临时强制搜索模式 - 用于调试
      const forceSearch = query.includes('查询') || query.includes('文章') || query.includes('高数') || 
                         query.includes('检索') || query.includes('笔记') || query.includes('数学');
      
      const finalShouldSearch = shouldSearch || forceSearch || (isDevelopment && debugMode);
      
      console.log('[LLMService] 搜索决策:', { 
        shouldSearch, 
        forceSearch, 
        isDevelopment, 
        debugMode,
        finalShouldSearch 
      });
      
      if (!finalShouldSearch) {
        console.log('[LLMService] 查询不需要文章搜索，跳过');
        return [];
      }

      console.log('[LLMService] 开始获取文章数据...');
      // 直接从Convex获取文章数据，避免HTTP请求问题
      const articles = await this.getArticlesFromConvex();
      console.log('[LLMService] 获取到文章数据:', { count: articles.length });
      
      // 更新搜索工具的文章数据
      this.articleSearchTool.updateArticles(articles);
      console.log('[LLMService] 已更新搜索工具的文章数据');
      
      // 搜索相关文章
      console.log('[LLMService] 开始执行文章搜索...');
      const searchResults = this.articleSearchTool.searchRelevantArticles(query, 3);
      
      console.log('[LLMService] 文章搜索完成', {
        query: query.substring(0, 50),
        totalArticles: articles.length,
        foundResults: searchResults.length,
        results: searchResults.map(r => ({
          title: r.article.title,
          score: r.relevanceScore.toFixed(3),
          keywords: r.matchedKeywords
        }))
      });

      debugLog('Article search completed', {
        query: query.substring(0, 50),
        totalArticles: articles.length,
        foundResults: searchResults.length,
        results: searchResults.map(r => ({
          title: r.article.title,
          score: r.relevanceScore,
          keywords: r.matchedKeywords
        }))
      });

      return searchResults;
    } catch (error) {
      console.error('[LLMService] 文章搜索失败:', error);
      debugLog('Article search failed', error instanceof Error ? error : String(error));
      return [];
    }
  }

  private async generateAIResponse(query: string, topic: string): Promise<string> {
    this.initializeAIProvider();

    if (!this.aiProvider) {
      throw new Error('AI provider not available');
    }

    // 搜索相关文章
    const articleResults = await this.searchRelevantArticles(query);
    const hasArticleRecommendations = articleResults.length > 0;

    const systemPrompt = this.buildSystemPrompt(topic, hasArticleRecommendations);

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

    // 如果有相关文章，在用户问题前添加文章信息
    let enhancedQuery = query;
    if (hasArticleRecommendations) {
      const articleInfo = articleResults.map(result => 
        `文章：《${result.article.title}》- ${result.article.introduction.label} (相关度: ${Math.round(result.relevanceScore * 100)}%)`
      ).join('\n');
      
      enhancedQuery = `用户问题：${query}\n\n我找到了以下相关文章：\n${articleInfo}\n\n请结合这些文章信息来回答用户的问题，并在回答末尾推荐这些文章。`;
    }

    // 添加当前问题
    messages.push({ role: 'user', content: enhancedQuery });

    debugLog('Generating AI response', {
      topic,
      messageCount: messages.length,
      query: query.substring(0, 100),
      hasArticleRecommendations,
      articleCount: articleResults.length
    });

    const response = await this.aiProvider.generateResponse(messages);

    debugLog('AI response generated', {
      contentLength: response.content.length,
      usage: response.usage,
      model: response.model
    });

    // 如果有文章推荐，添加格式化的文章链接
    let finalResponse = response.content;
    if (hasArticleRecommendations) {
      const formattedRecommendations = this.articleSearchTool.formatArticleRecommendations(articleResults);
      finalResponse += formattedRecommendations;
    }

    return finalResponse;
  }

  private async getDetailedResponse(query: string, topic: string): Promise<string> {
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

    // 尝试添加文章推荐（即使在模板回答中）
    try {
      const articleResults = await this.searchRelevantArticles(query);
      if (articleResults.length > 0) {
        const formattedRecommendations = this.articleSearchTool.formatArticleRecommendations(articleResults);
        detailedResponse += formattedRecommendations;
      }
    } catch (error) {
      debugLog('Failed to add article recommendations to template response', error instanceof Error ? error : String(error));
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
      reply = await this.getDetailedResponse(query, topic);
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