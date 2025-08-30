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
    
    // 检查服务状态
    if (!config.enabled) {
      return NextResponse.json(
        { 
          error: 'Service disabled',
          reply: 'LLM 服务当前已禁用。请联系管理员启用服务。',
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
  return NextResponse.json({
    status: 'ok',
    message: 'Local LLM Chat Service is running',
    timestamp: new Date().toISOString()
  });
}