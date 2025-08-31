/**
 * 文章服务 - 处理文章数据获取
 */

import { ArticleProps } from '@/constants/interfaces';

// 文章服务类
export class ArticleService {
  private static instance: ArticleService;
  private articlesCache: ArticleProps[] = [];
  private lastFetchTime: number = 0;
  private cacheExpiry: number = 5 * 60 * 1000; // 5分钟缓存

  private constructor() {}

  static getInstance(): ArticleService {
    if (!ArticleService.instance) {
      ArticleService.instance = new ArticleService();
    }
    return ArticleService.instance;
  }

  // 获取所有文章（带缓存）
  async getAllArticles(): Promise<ArticleProps[]> {
    const now = Date.now();
    
    console.log('[ArticleService] 开始获取文章', {
      cacheSize: this.articlesCache.length,
      lastFetchTime: this.lastFetchTime,
      cacheAge: now - this.lastFetchTime,
      cacheExpiry: this.cacheExpiry,
      shouldUseCache: this.articlesCache.length > 0 && (now - this.lastFetchTime) < this.cacheExpiry
    });
    
    // 如果缓存有效，直接返回缓存数据
    if (this.articlesCache.length > 0 && (now - this.lastFetchTime) < this.cacheExpiry) {
      console.log('[ArticleService] 使用缓存数据', { articleCount: this.articlesCache.length });
      return this.articlesCache;
    }

    try {
      console.log('[ArticleService] 开始从API获取文章数据...');
      
      // 调用Convex API获取文章
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const apiUrl = `${baseUrl}/api/articles/all`;
      
      console.log('[ArticleService] 调用API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[ArticleService] API响应状态:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
      }

      const articles: ArticleProps[] = await response.json();
      
      console.log('[ArticleService] 成功获取文章数据', {
        articleCount: articles.length,
        articles: articles.map(a => ({ id: a.id, title: a.title, label: a.introduction?.label }))
      });
      
      // 更新缓存
      this.articlesCache = articles;
      this.lastFetchTime = now;
      
      return articles;
    } catch (error) {
      console.error('[ArticleService] 获取文章失败:', error);
      
      // 如果请求失败但有缓存数据，返回缓存数据
      if (this.articlesCache.length > 0) {
        console.log('[ArticleService] 使用旧缓存数据作为fallback', { articleCount: this.articlesCache.length });
        return this.articlesCache;
      }
      
      console.log('[ArticleService] 没有可用数据，返回空数组');
      // 否则返回空数组
      return [];
    }
  }

  // 清除缓存
  clearCache(): void {
    this.articlesCache = [];
    this.lastFetchTime = 0;
  }

  // 根据ID获取单篇文章
  async getArticleById(id: string): Promise<ArticleProps | null> {
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching article by id:', error);
      return null;
    }
  }
}

// 导出单例实例
export const articleService = ArticleService.getInstance();