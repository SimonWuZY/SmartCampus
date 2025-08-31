/**
 * 简化的 AI 提供商 - 只支持 DeepSeek
 */

import OpenAI from 'openai';
import { debugLog } from './env';

// AI 响应接口
export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

// DeepSeek 配置
export interface DeepSeekConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

// DeepSeek 提供商实现
export class DeepSeekProvider {
  private client: OpenAI;
  private config: DeepSeekConfig;

  constructor(config: DeepSeekConfig) {
    this.config = config;
    
    if (!config.apiKey) {
      throw new Error('DeepSeek API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: 'https://api.deepseek.com/v1',
    });
  }

  async generateResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): Promise<AIResponse> {
    try {
      debugLog('DeepSeek API request', {
        model: this.config.model,
        messageCount: messages.length,
        maxTokens: this.config.maxTokens
      });

      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw new Error('No content in DeepSeek response');
      }

      debugLog('DeepSeek API response', {
        usage: completion.usage,
        finishReason: choice.finish_reason
      });

      return {
        content: choice.message.content,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
        model: completion.model,
        finishReason: choice.finish_reason || undefined,
      };
    } catch (error) {
      debugLog('DeepSeek API error', error);
      throw new Error(`DeepSeek API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// 配置工厂
export function createDeepSeekConfig(): DeepSeekConfig {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2000'),
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  };
}