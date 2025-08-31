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
    
    // 中文分词 - 简单实现
    const chineseWords = this.extractChineseKeywords(cleanText);
    
    // 英文分词
    const englishWords = cleanText.split(/\s+/).filter(word => 
      word.length > 1 && /^[a-zA-Z]+$/.test(word)
    );
    
    // 合并并去重
    const allWords = [...chineseWords, ...englishWords];
    return [...new Set(allWords)];
  }

  // 简单的中文关键词提取
  private extractChineseKeywords(text: string): string[] {
    const keywords: string[] = [];
    
    // 预定义的重要词汇
    const importantTerms = [
      '高等数学', '高数', '数学', '微积分', '线性代数', '概率论', '统计学',
      '前端开发', '后端开发', '编程', '算法', '数据结构',
      '学习', '复习', '笔记', '教程', '指南', '方法',
      '文章', '资料', '材料', '内容'
    ];
    
    // 检查重要词汇
    importantTerms.forEach(term => {
      if (text.includes(term)) {
        keywords.push(term);
      }
    });
    
    // 简单的双字词提取
    for (let i = 0; i < text.length - 1; i++) {
      const twoChar = text.substring(i, i + 2);
      if (/^[\u4e00-\u9fff]{2}$/.test(twoChar)) {
        keywords.push(twoChar);
      }
    }
    
    // 简单的三字词提取
    for (let i = 0; i < text.length - 2; i++) {
      const threeChar = text.substring(i, i + 3);
      if (/^[\u4e00-\u9fff]{3}$/.test(threeChar)) {
        keywords.push(threeChar);
      }
    }
    
    return [...new Set(keywords)];
  }

  // 检查两个词是否相似（处理同义词）
  private isSimilarWord(word1: string, word2: string): boolean {
    const synonyms = {
      '高数': ['高等数学', '数学', '微积分'],
      '高等数学': ['高数', '数学', '微积分'],
      '数学': ['高数', '高等数学', '微积分'],
      '复习': ['学习', '笔记', '教程'],
      '学习': ['复习', '笔记', '教程'],
      '笔记': ['复习', '学习', '教程'],
      '前端': ['前端开发', 'frontend', 'web开发'],
      '前端开发': ['前端', 'frontend', 'web开发']
    };

    // 检查直接匹配
    if (word1 === word2) return true;
    
    // 检查同义词匹配
    const word1Synonyms = synonyms[word1] || [];
    const word2Synonyms = synonyms[word2] || [];
    
    return word1Synonyms.includes(word2) || word2Synonyms.includes(word1);
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
      let matched = false;
      
      // 标题匹配权重最高
      if (titleKeywords.some(titleWord => 
        titleWord.includes(queryWord) || queryWord.includes(titleWord) ||
        this.isSimilarWord(queryWord, titleWord)
      )) {
        score += 3;
        matchedKeywords.push(queryWord);
        matched = true;
      }
      // 标签匹配权重中等
      else if (labelKeywords.some(labelWord => 
        labelWord.includes(queryWord) || queryWord.includes(labelWord) ||
        this.isSimilarWord(queryWord, labelWord)
      )) {
        score += 2;
        matchedKeywords.push(queryWord);
        matched = true;
      }
      // 内容匹配权重较低
      else if (contentKeywords.some(contentWord => 
        contentWord.includes(queryWord) || queryWord.includes(contentWord) ||
        this.isSimilarWord(queryWord, contentWord)
      )) {
        score += 1;
        matchedKeywords.push(queryWord);
        matched = true;
      }
      
      console.log(`[ArticleSearchTool] 关键词匹配检查: "${queryWord}"`, {
        titleKeywords: titleKeywords.slice(0, 5),
        labelKeywords: labelKeywords.slice(0, 5),
        matched
      });
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
        threshold: 0.05,
        willInclude: score > 0.05
      });
      
      // 只返回有一定相关性的文章（阈值可调整）
      if (score > 0.05) {
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
    // 扩展触发词列表
    const searchTriggers = [
      // 动作词
      '推荐', '文章', '学习', '复习', '教程', '指南', '方法', '查询', '检索', '搜索', '找', '寻找',
      '如何', '怎么', '什么是', '告诉我', '介绍', '解释', '有关', '关于', '相关',
      // 学科词
      '高数', '数学', '编程', '算法', '前端', '后端', '高等数学', '微积分', '线性代数',
      // 内容词
      '笔记', '资料', '材料', '内容'
    ];

    const lowerQuery = query.toLowerCase();
    
    // 检查直接匹配
    const directMatches = searchTriggers.filter(trigger => 
      lowerQuery.includes(trigger)
    );
    
    // 检查模式匹配
    const patterns = [
      /.*文章.*/, // 包含"文章"
      /.*笔记.*/, // 包含"笔记"
      /.*学习.*/, // 包含"学习"
      /.*复习.*/, // 包含"复习"
      /.*高数.*/, // 包含"高数"
      /.*数学.*/, // 包含"数学"
      /.*检索.*/, // 包含"检索"
      /.*查询.*/, // 包含"查询"
      /.*推荐.*/, // 包含"推荐"
    ];
    
    const patternMatches = patterns.filter(pattern => pattern.test(lowerQuery));
    
    // 如果查询长度较长且包含问号或疑问词，也触发搜索
    const isQuestion = lowerQuery.includes('?') || lowerQuery.includes('？') || 
                      lowerQuery.includes('什么') || lowerQuery.includes('如何') || 
                      lowerQuery.includes('怎么');
    
    const shouldSearch = directMatches.length > 0 || patternMatches.length > 0 || 
                        (isQuestion && lowerQuery.length > 10);
    
    console.log('[ArticleSearchTool] 检查是否需要搜索:', {
      query: query.substring(0, 100),
      lowerQuery: lowerQuery.substring(0, 100),
      directMatches,
      patternMatches: patternMatches.map(p => p.source),
      isQuestion,
      shouldSearch
    });
    
    return shouldSearch;
  }
}

// 单例实例
export const articleSearchTool = new ArticleSearchTool();