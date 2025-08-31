/**
 * AI 提供商接口和实现
 * 支持多种 AI 服务：OpenAI, Anthropic, 等
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
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

// AI 提供商配置
export interface AIConfig {
  provider: 'deepseek';
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  baseURL?: string;
}

// 基础 AI 提供商接口
export abstract class BaseAIProvider {
  protected config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  abstract generateResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { stream?: boolean }
  ): Promise<AIResponse>;

  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error(`API key is required for ${this.config.provider}`);
    }
  }
}

// OpenAI 提供商实现
export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;

  constructor(config: AIConfig) {
    super(config);
    this.validateConfig();
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  async generateResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): Promise<AIResponse> {
    try {
      debugLog('OpenAI API request', {
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
        throw new Error('No content in OpenAI response');
      }

      debugLog('OpenAI API response', {
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
      debugLog('OpenAI API error', error);
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// DeepSeek 提供商实现 (使用 OpenAI 兼容接口)
export class DeepSeekProvider extends BaseAIProvider {
  private client: OpenAI;

  constructor(config: AIConfig) {
    super(config);
    this.validateConfig();
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

// Anthropic (Claude) 提供商实现
export class AnthropicProvider extends BaseAIProvider {
  private client: Anthropic;

  constructor(config: AIConfig) {
    super(config);
    this.validateConfig();
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async generateResponse(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): Promise<AIResponse> {
    try {
      debugLog('Anthropic API request', {
        model: this.config.model,
        messageCount: messages.length,
        maxTokens: this.config.maxTokens
      });

      // 分离系统消息和对话消息
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const conversationMessages = messages.filter(m => m.role !== 'system');

      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemMessage,
        messages: conversationMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      });

      if (!response.content[0] || response.content[0].type !== 'text') {
        throw new Error('No text content in Anthropic response');
      }

      debugLog('Anthropic API response', {
        usage: response.usage,
        stopReason: response.stop_reason
      });

      return {
        content: response.content[0].text,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        model: response.model,
        finishReason: response.stop_reason || undefined,
      };
    } catch (error) {
      debugLog('Anthropic API error', error);
      throw new Error(`Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// AI 提供商工厂
export class AIProviderFactory {
  static createProvider(config: AIConfig): BaseAIProvider {
    switch (config.provider) {
      case 'deepseek':
        return new DeepSeekProvider(config);
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  static getConfigFromEnv(): AIConfig {
    const provider = (process.env.LLM_PROVIDER || 'deepseek') as AIConfig['provider'];
    
    let apiKey: string;
    let model: string;
    let baseURL: string | undefined;

    switch (provider) {
      case 'deepseek':
        apiKey = process.env.DEEPSEEK_API_KEY || '';
        model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
        baseURL = 'https://api.deepseek.com/v1';
        break;
      case 'openai':
        apiKey = process.env.OPENAI_API_KEY || '';
        model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        break;
      case 'anthropic':
        apiKey = process.env.ANTHROPIC_API_KEY || '';
        model = process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    return {
      provider,
      apiKey,
      model,
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
      baseURL,
    };
  }
}