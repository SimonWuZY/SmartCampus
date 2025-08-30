/**
 * 环境配置工具函数
 * 处理不同环境下的配置差异
 */

// 获取应用的基础 URL
export function getBaseUrl(): string {
  // 1. 优先使用环境变量中的 URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 2. Vercel 环境自动检测
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. 生产环境检测
  if (process.env.NODE_ENV === 'production') {
    // 这里应该是你的实际生产域名
    return 'https://your-app-domain.vercel.app';
  }

  // 4. 开发环境默认值
  return 'http://localhost:3000';
}

// 获取 API 基础路径
export function getApiUrl(endpoint: string = ''): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api${endpoint}`;
}

// 环境检测函数
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isVercel = () => !!process.env.VERCEL;

// LLM 配置获取
export function getLLMConfig() {
  return {
    enabled: process.env.LLM_SERVICE_ENABLED === 'true',
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2000'),
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    typingSpeed: parseInt(process.env.LLM_TYPING_SPEED || '30'),
    debug: process.env.DEBUG_LLM === 'true'
  };
}

// 日志数据类型定义
type LogData =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, unknown>
  | Array<unknown>
  | Error;

// 日志工具
export function debugLog(message: string, data?: LogData) {
  if (getLLMConfig().debug || isDevelopment()) {
    console.log(`[LLM Debug] ${message}`, data || '');
  }
}