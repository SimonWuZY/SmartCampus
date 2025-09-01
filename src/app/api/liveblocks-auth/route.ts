/**
 * Liveblocks 认证路由
 * 为协作文档功能提供用户认证
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { Liveblocks } from '@liveblocks/node';

// 初始化 Liveblocks
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // 获取当前用户认证信息
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 从请求中获取房间信息
    const { room } = await request.json();

    // 创建 Liveblocks 会话
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: user.fullName || user.firstName || 'Anonymous',
        avatar: user.imageUrl || '',
        color: generateUserColor(userId), // 为用户生成一个颜色
      },
    });

    // 为特定房间授权访问权限
    if (room) {
      session.allow(room, session.FULL_ACCESS);
    }

    // 授权会话
    const { status, body } = await session.authorize();

    return new NextResponse(body, { status });

  } catch (error) {
    console.error('Liveblocks auth error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      status: 'Liveblocks auth endpoint',
      configured: true,
      hasSecretKey: !!process.env.LIVEBLOCKS_SECRET_KEY
    },
    { status: 200 }
  );
}

// 为用户生成一致的颜色
function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];
  
  // 使用用户ID生成一致的颜色索引
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}