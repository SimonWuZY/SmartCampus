import { NextResponse } from 'next/server';
import { getDefaultLLMConfig } from '@/lib/llm-config';
import { llmService } from '@/lib/llm-service';
import { getLLMConfig } from '@/lib/env';

export async function GET() {
  try {
    const config = getDefaultLLMConfig();
    const envConfig = getLLMConfig();
    const stats = llmService.getStats();
    
    // 检查 AI 配置状态
    const aiStatus = {
      provider: envConfig.provider,
      hasApiKey: envConfig.hasApiKey,
      model: process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || process.env.ANTHROPIC_MODEL || 'not configured',
      apiKeyStatus: envConfig.hasApiKey ? 'configured' : 'missing'
    };
    
    const status = {
      service: 'Local LLM Chat Service',
      status: config.enabled ? 'online' : 'disabled',
      version: '1.0.0',
      config: {
        enabled: config.enabled,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        typingSpeed: config.typingSpeed,
        debug: config.debug
      },
      aiProvider: aiStatus,
      features: [
        'Real AI integration (OpenAI, Anthropic)',
        'Multi-topic conversation',
        'Context-aware responses',
        'Conversation history with statistics',
        'Real-time typing simulation',
        'Topic detection and confidence scoring',
        'Performance monitoring',
        'Request tracking',
        'Fallback to template responses'
      ],
      statistics: stats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      endpoints: {
        chat: '/api/chat',
        history: '/api/chat/history',
        status: '/api/chat/status',
        test: '/api/chat/test'
      }
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { 
        service: 'Local LLM Chat Service',
        status: 'error',
        error: 'Failed to retrieve status',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}