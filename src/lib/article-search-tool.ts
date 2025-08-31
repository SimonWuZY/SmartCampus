/**
 * 文章检索工具 - 为LLM提供智能文章搜索功能
 */

import { ArticleProps } from '@/constants/interfaces';

// 文章检索结果接口
export interface ArticleSearchResult {
  article: ArticleProps;
  relevanceScore: number;
  matchedKeywords: string[];
}

// 文章检索工具类
export class ArticleSearchTool {
  private articles: ArticleProps[] = [];

  constructor(articles: ArticleProps[] = []) {
    this.articles = articles;
  }

  // 更新文章数据
  updateArticles(articles: ArticleProps[]): void {
    this.articles = articles;
  }

  // 提取关键词
  private extractKeywords(text: string): string[] {
    // 移除标点符号并转换为小写
    const cleanText = text.toLowerCase().replace(/[^\w\s\u4e00-\u9fff]/g, ' ');
    
    // 分词（简单的空格分割，实际项目中可以使用更复杂的中文分词）
    const words = cleanText.split(/\s+/).filter(word => word.length > 1);
    
    // 去重
    return [...new Set(words)];
  }

  // 计算文本相似度
  private calculateSimilarity(query: string, article: ArticleProps): {
    score: number;
    matchedKeywords: string[];
  } {
    const queryKeywords = this.extractKeywords(query);
    const titleKeywords = this.extractKeywords(article.title);
    const contentKeywords = this.extractKeywords(article.content);
    const labelKeywords = this.extractKeywords(article.introduction.label);
    
    // 合并文章所有关键词（用于未来扩展）
    // const allArticleKeywords = [
    //   ...titleKeywords,
    //   ...contentKeywords,
    //   ...labelKeywords
    // ];

    let score = 0;
    const matchedKeywords: string[] = [];

    // 计算匹配度
    queryKeywords.forEach(queryWord => {
      // 标题匹配权重最高
      if (titleKeywords.some(titleWord => 
        titleWord.includes(queryWord) || queryWord.includes(titleWord)
      )) {
        score += 3;
        matchedKeywords.push(queryWord);
      }
      // 标签匹配权重中等
      else if (labelKeywords.some(labelWord => 
        labelWord.includes(queryWord) || queryWord.includes(labelWord)
      )) {
        score += 2;
        matchedKeywords.push(queryWord);
      }
      // 内容匹配权重较低
      else if (contentKeywords.some(contentWord => 
        contentWord.includes(queryWord) || queryWord.includes(contentWord)
      )) {
        score += 1;
        matchedKeywords.push(queryWord);
      }
    });

    // 标准化分数 (0-1)
    const maxPossibleScore = queryKeywords.length * 3;
    const normalizedScore = maxPossibleScore > 0 ? score / maxPossibleScore : 0;

    return {
      score: normalizedScore,
      matchedKeywords: [...new Set(matchedKeywords)]
    };
  }

  // 搜索相关文章
  searchRelevantArticles(query: string, limit: number = 3): ArticleSearchResult[] {
    console.log('[ArticleSearchTool] 开始搜索文章', {
      query: query.substring(0, 100),
      queryLength: query.length,
      availableArticles: this.articles.length,
      limit
    });

    if (!query.trim()) {
      console.log('[ArticleSearchTool] 查询为空，返回空结果');
      return [];
    }

    if (this.articles.length === 0) {
      console.log('[ArticleSearchTool] 没有可用文章，返回空结果');
      return [];
    }

    const results: ArticleSearchResult[] = [];
    const queryKeywords = this.extractKeywords(query);
    
    console.log('[ArticleSearchTool] 提取的查询关键词:', queryKeywords);

    // 为每篇文章计算相关性分数
    this.articles.forEach((article, index) => {
      const { score, matchedKeywords } = this.calculateSimilarity(query, article);
      
      console.log(`[ArticleSearchTool] 文章 ${index + 1} 分析:`, {
        title: article.title,
        label: article.introduction?.label,
        score: score.toFixed(3),
        matchedKeywords,
        threshold: 0.1,
        willInclude: score > 0.1
      });
      
      // 只返回有一定相关性的文章（阈值可调整）
      if (score > 0.1) {
        results.push({
          article,
          relevanceScore: score,
          matchedKeywords
        });
      }
    });

    // 按相关性分数排序并限制数量
    const sortedResults = results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    console.log('[ArticleSearchTool] 搜索完成', {
      totalResults: results.length,
      returnedResults: sortedResults.length,
      results: sortedResults.map(r => ({
        title: r.article.title,
        score: r.relevanceScore.toFixed(3),
        keywords: r.matchedKeywords
      }))
    });

    return sortedResults;
  }

  // 生成文章推荐的格式化文本
  formatArticleRecommendations(searchResults: ArticleSearchResult[]): string {
    if (searchResults.length === 0) {
      return '';
    }

    let formattedText = '\n\n📚 **相关文章推荐**：\n\n';
    
    searchResults.forEach((result, index) => {
      const { article, relevanceScore, matchedKeywords } = result;
      
      formattedText += `${index + 1}. **${article.title}**\n`;
      formattedText += `   📝 ${article.introduction.label}\n`;
      formattedText += `   👤 作者：${article.introduction.author}\n`;
      formattedText += `   🎯 匹配关键词：${matchedKeywords.join(', ')}\n`;
      formattedText += `   📊 相关度：${Math.round(relevanceScore * 100)}%\n`;
      formattedText += `   🔗 [点击查看文章](/smartcampus/articles/${article.id})\n\n`;
    });

    return formattedText;
  }

  // 检查查询是否需要文章推荐
  shouldSearchArticles(query: string): boolean {
    const searchTriggers = [
      '推荐', '文章', '学习', '复习', '教程', '指南', '方法',
      '如何', '怎么', '什么是', '告诉我', '介绍', '解释',
      '高数', '数学', '编程', '算法', '前端', '后端'
    ];

    const lowerQuery = query.toLowerCase();
    const matchedTriggers = searchTriggers.filter(trigger => 
      lowerQuery.includes(trigger) || lowerQuery.includes(trigger.toLowerCase())
    );
    
    const shouldSearch = matchedTriggers.length > 0;
    
    console.log('[ArticleSearchTool] 检查是否需要搜索:', {
      query: query.substring(0, 50),
      matchedTriggers,
      shouldSearch
    });
    
    return shouldSearch;
  }
}

// 单例实例
export const articleSearchTool = new ArticleSearchTool();