import { NextResponse } from 'next/server';
import { DeepSeekProvider, createDeepSeekConfig } from '@/lib/ai-providers-simple';

export async function GET() {
    try {
        // 检查环境变量配置
        const provider = process.env.LLM_PROVIDER || 'deepseek';
        const deepseekKey = process.env.DEEPSEEK_API_KEY;

        const checks = {
            provider,
            apiKeys: {
                deepseek: {
                    configured: !!deepseekKey,
                    keyPreview: deepseekKey ? `${deepseekKey.substring(0, 8)}...` : 'not set'
                }
            },
            currentProvider: {
                name: provider,
                hasKey: !!deepseekKey,
                model: process.env.DEEPSEEK_MODEL || 'deepseek-chat'
            }
        };

        // 尝试初始化 AI 提供商
        const initializationTest = {
            success: false,
            error: null as string | null
        };

        try {
            const config = createDeepSeekConfig();
            new DeepSeekProvider(config);
            initializationTest.success = true;
        } catch (error) {
            initializationTest.error = error instanceof Error ? error.message : 'Unknown error';
        }

        return NextResponse.json({
            message: 'API Key Configuration Check',
            checks,
            initialization: initializationTest,
            recommendations: getRecommendations(checks),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        return NextResponse.json(
            {
                error: 'Configuration check failed',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

function getRecommendations(checks: { 
    provider: string; 
    apiKeys: { deepseek: { configured: boolean } }; 
    currentProvider: { hasKey: boolean } 
}): string[] {
    const recommendations: string[] = [];

    if (!checks.currentProvider.hasKey) {
        recommendations.push(`Configure ${checks.provider.toUpperCase()} API key in environment variables`);
    }

    if (!checks.apiKeys.deepseek.configured) {
        recommendations.push('Set DEEPSEEK_API_KEY in .env.local file');
        recommendations.push('Visit https://platform.deepseek.com/api_keys to get your API key');
        recommendations.push('DeepSeek offers very competitive pricing and good performance');
    }

    if (recommendations.length === 0) {
        recommendations.push('Configuration looks good! Your AI provider should be working.');
    }

    return recommendations;
}