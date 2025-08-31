import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';
import { debugLog, getLLMConfig } from '@/lib/env';

// 接口定义
interface ChatRequest {
  query: string;
  context?: string;
}

interface ChatResponse {
  reply: string;
  timestamp: string;
  topic?: string;
  confidence?: number;
  processingTime?: number;
}

export async function POST(request: NextRequest) {
  try {
    const config = getLLMConfig();
    
    // 详细的服务状态检查
    if (!config.enabled) {
      console.error('[Chat API] Service disabled - Environment check:', {
        LLM_SERVICE_ENABLED: process.env.LLM_SERVICE_ENABLED,
        hasApiKey: config.hasApiKey,
        provider: config.provider,
        nodeEnv: process.env.NODE_ENV
      });
      
      return NextResponse.json(
        { 
          error: 'Service disabled',
          reply: 'LLM 服务当前已禁用。请检查环境变量 LLM_SERVICE_ENABLED 是否设置为 true。',
          timestamp: new Date().toISOString(),
          debug: {
            enabled: config.enabled,
            hasApiKey: config.hasApiKey,
            provider: config.provider
          }
        },
        { status: 503 }
      );
    }

    // 检查 API 密钥
    if (!config.hasApiKey) {
      console.error('[Chat API] No API key configured');
      return NextResponse.json(
        { 
          error: 'API key missing',
          reply: '未配置 AI 服务的 API 密钥。请检查环境变量配置。',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    const body: ChatRequest = await request.json();
    
    if (!body.query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    debugLog('Received chat request', { 
      queryLength: body.query.length,
      hasContext: !!body.context 
    });

    const { reply, topic, confidence, processingTime } = await llmService.processQuery(body.query);
    
    const response: ChatResponse = {
      reply,
      timestamp: new Date().toISOString(),
      topic,
      confidence,
      processingTime
    };

    debugLog('Chat response generated', { 
      topic, 
      confidence, 
      replyLength: reply.length,
      processingTime
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        reply: '抱歉，服务暂时不可用。请稍后再试，或者检查你的网络连接。',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 支持 GET 请求用于健康检查
export async function GET() {
  const config = getLLMConfig();
  
  return NextResponse.json({
    status: config.enabled ? 'ok' : 'disabled',
    message: 'Local LLM Chat Service',
    timestamp: new Date().toISOString(),
    config: {
      enabled: config.enabled,
      hasApiKey: config.hasApiKey,
      provider: config.provider,
      maxTokens: config.maxTokens,
      temperature: config.temperature
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      hasConvexUrl: !!process.env.NEXT_PUBLIC_CONVEX_URL
    }
  });
}