/**
 * Liveblocks 认证路由占位符
 * 如果不使用Liveblocks功能，这个路由提供基本的占位符响应
 */

import { NextResponse } from 'next/server';

export async function POST() {
  // 返回一个基本的响应，表示Liveblocks功能未配置
  return NextResponse.json(
    { 
      error: 'Liveblocks not configured',
      message: 'Liveblocks authentication is not set up for this application'
    },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json(
    { 
      status: 'Liveblocks auth endpoint',
      configured: false
    },
    { status: 200 }
  );
}