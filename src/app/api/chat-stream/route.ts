import { NextRequest } from 'next/server';
import { debugLog, getLLMConfig } from '@/lib/env';
import { llmService } from '@/lib/llm-service';

// 智能分块函数 - 避免破坏中文字符和 Markdown 格式
function smartChunkText(text: string): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 空行直接添加
    if (line.trim() === '') {
      chunks.push('\n');
      continue;
    }
    
    // Markdown 特殊格式保持完整性
    if (line.match(/^#{1,6}\s/) ||           // 标题
        line.match(/^\s*[-*+]\s/) ||         // 无序列表
        line.match(/^\s*\d+\.\s/) ||         // 有序列表
        line.match(/^\s*>\s/) ||             // 引用
        line.match(/^```/) ||                // 代码块
        line.match(/^\|.*\|/) ||             // 表格
        line.match(/^---+$/) ||              // 分隔线
        line.startsWith('📚') ||             // emoji 开头的特殊行
        line.startsWith('🎯') ||
        line.startsWith('📝') ||
        line.startsWith('📊') ||
        line.startsWith('🔗')) {
      chunks.push(line + (i < lines.length - 1 ? '\n' : ''));
      continue;
    }
    
    // 对于普通文本，按中文友好的方式分块
    const segments = line.split(/([，。！？；：""''（）【】《》、\s]+)/);
    let currentChunk = '';
    
    for (const segment of segments) {
      if (!segment) continue;
      
      // 如果是标点符号或空白，直接添加
      if (segment.match(/^[，。！？；：""''（）【】《》、\s]+$/)) {
        currentChunk += segment;
        continue;
      }
      
      // 控制块大小，避免过长或过短
      const newLength = currentChunk.length + segment.length;
      if (currentChunk.length > 0 && newLength > 12) {
        chunks.push(currentChunk);
        currentChunk = segment;
      } else {
        currentChunk += segment;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk + (i < lines.length - 1 ? '\n' : ''));
    }
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

// SSE 响应类型
interface StreamMessage {
  type: 'start' | 'chunk' | 'end' | 'error';
  content?: string;
  metadata?: {
    topic?: string;
    confidence?: number;
    processingTime?: number;
  };
}

export async function POST(request: NextRequest) {
  const config = getLLMConfig();

  // 检查服务状态
  if (!config.enabled) {
    return new Response(
      JSON.stringify({
        error: 'Service disabled',
        message: 'LLM 服务当前已禁用'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    debugLog('Starting SSE chat stream', { queryLength: query.length });

    // 创建 SSE 流
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // 发送开始消息
        const startMessage: StreamMessage = {
          type: 'start',
          content: '正在思考中...'
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(startMessage)}\n\n`)
        );

        try {
          // 获取 LLM 响应
          const startTime = Date.now();
          const response = await llmService.processQuery(query);
          const processingTime = Date.now() - startTime;

          // 智能分块策略 - 避免中文字符和 Markdown 格式被破坏
          const fullContent = response.reply;
          const chunks = smartChunkText(fullContent);
          
          debugLog('Smart chunking completed', {
            originalLength: fullContent.length,
            chunksCount: chunks.length,
            avgChunkSize: Math.round(fullContent.length / chunks.length)
          });

          // 发送每个块
          for (const chunk of chunks) {
            if (chunk.length > 0) {
              try {
                const chunkMessage: StreamMessage = {
                  type: 'chunk',
                  content: chunk
                };

                // 确保 JSON 序列化正确
                const jsonData = JSON.stringify(chunkMessage);
                controller.enqueue(
                  encoder.encode(`data: ${jsonData}\n\n`)
                );

                // 添加适当延迟模拟真实流式输出
                await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
              } catch (encodeError) {
                console.error('Chunk encoding error:', encodeError, 'Chunk:', chunk);
                // 跳过有问题的块，继续处理下一个
                continue;
              }
            }
          }

          // 发送结束消息
          const endMessage: StreamMessage = {
            type: 'end',
            metadata: {
              topic: response.topic,
              confidence: response.confidence,
              processingTime
            }
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(endMessage)}\n\n`)
          );

          debugLog('SSE stream completed', {
            topic: response.topic,
            confidence: response.confidence,
            processingTime,
            chunks: chunks.length
          });

        } catch (error) {
          console.error('SSE stream error:', error);

          const errorMessage: StreamMessage = {
            type: 'error',
            content: '抱歉，服务暂时不可用。请稍后再试。'
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`)
          );
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Chat stream API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: '服务器内部错误'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 支持 OPTIONS 请求（CORS 预检）
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}