/**
 * 测试文章检索功能的调试端点
 */

import { NextRequest, NextResponse } from 'next/server';
import { ArticleSearchTool } from '@/lib/article-search-tool';
import { articleService } from '@/lib/article-service';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    console.log('[TEST] 开始测试文章检索:', { query });
    
    // 1. 测试获取文章数据
    const articles = await articleService.getAllArticles();
    console.log('[TEST] 获取到的文章:', {
      count: articles.length,
      articles: articles.map(a => ({
        id: a.id,
        title: a.title,
        label: a.introduction?.label,
        author: a.introduction?.author
      }))
    });
    
    // 2. 测试搜索工具
    const searchTool = new ArticleSearchTool();
    searchTool.updateArticles(articles);
    
    // 3. 测试触发检查
    const shouldSearch = searchTool.shouldSearchArticles(query);
    console.log('[TEST] 触发检查结果:', { shouldSearch });
    
    // 4. 强制执行搜索
    const searchResults = searchTool.searchRelevantArticles(query, 5);
    console.log('[TEST] 搜索结果:', {
      count: searchResults.length,
      results: searchResults.map(r => ({
        title: r.article.title,
        score: r.relevanceScore,
        keywords: r.matchedKeywords
      }))
    });
    
    return NextResponse.json({
      success: true,
      query,
      articlesCount: articles.length,
      shouldSearch,
      searchResults: searchResults.map(r => ({
        title: r.article.title,
        label: r.article.introduction?.label,
        author: r.article.introduction?.author,
        score: r.relevanceScore,
        matchedKeywords: r.matchedKeywords
      }))
    });
    
  } catch (error) {
    console.error('[TEST] 测试失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}