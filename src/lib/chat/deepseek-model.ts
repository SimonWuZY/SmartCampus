import { ChatOpenAI } from "@langchain/openai";

/** DeepSeek OpenAI 兼容 API，后续可换为自建 Qwen 等 OpenAI 兼容端点 */
export function createDeepseekChatModel(options?: { temperature?: number; maxTokens?: number }) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        throw new Error("DEEPSEEK_API_KEY is not set");
    }
    const baseURL = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
    const modelName = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

    return new ChatOpenAI({
        apiKey,
        model: modelName,
        temperature: options?.temperature ?? 0.3,
        maxTokens: options?.maxTokens,
        configuration: { baseURL },
    });
}
