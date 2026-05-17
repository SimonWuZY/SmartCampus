/**
 * DeepSeek OpenAI 兼容接口：非流式一次返回完整文本（用于 Writer 等短输出）。
 */
export async function completeDeepseekChat(options: {
    system: string;
    user: string;
    temperature?: number;
    maxTokens?: number;
}): Promise<string> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        throw new Error("DEEPSEEK_API_KEY is not set");
    }
    const baseURL = (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/$/, "");
    const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

    const res = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            temperature: options.temperature ?? 0.3,
            max_tokens: options.maxTokens,
            stream: false,
            messages: [
                { role: "system", content: options.system },
                { role: "user", content: options.user },
            ],
        }),
    });

    if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`DeepSeek complete HTTP ${res.status}: ${t.slice(0, 300)}`);
    }

    const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
        throw new Error("DeepSeek complete: empty content");
    }
    return text;
}
