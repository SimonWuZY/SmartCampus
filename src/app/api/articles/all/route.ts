/**
 * 获取所有文章的API路由
 */

import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

// 初始化 Convex 客户端
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  console.log('[API] /api/articles/all - 开始处理请求');
  
  try {
    console.log('[API] 准备调用 Convex 查询...');
    console.log('[API] Convex URL:', process.env.NEXT_PUBLIC_CONVEX_URL);
    
    // 调用 Convex 查询获取所有文章
    const articles = await convex.query(api.articles.getAllArticles);
    
    console.log('[API] Convex 查询成功', {
      articleCount: articles?.length || 0,
      articles: articles?.map(a => ({ id: a.id, title: a.title })) || []
    });
    
    return NextResponse.json(articles, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5分钟缓存
      },
    });
  } catch (error) {
    console.error('[API] 获取文章失败:', error);
    console.error('[API] 错误详情:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch articles',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}