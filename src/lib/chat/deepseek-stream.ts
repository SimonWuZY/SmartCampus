/**
 * 直接调用 DeepSeek OpenAI 兼容流式接口，输出文本增量（便于在 Route Handler 里转 SSE）。
 */
export async function* streamDeepseekChatCompletion(options: {
    system: string;
    user: string;
    temperature?: number;
    maxTokens?: number;
}): AsyncGenerator<string, void, unknown> {
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
            stream: true,
            messages: [
                { role: "system", content: options.system },
                { role: "user", content: options.user },
            ],
        }),
    });

    if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        throw new Error(`DeepSeek stream HTTP ${res.status}: ${t.slice(0, 300)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") return;
            try {
                const json = JSON.parse(payload) as {
                    choices?: Array<{ delta?: { content?: string } }>;
                };
                const piece = json.choices?.[0]?.delta?.content;
                if (piece) yield piece;
            } catch {
                // 忽略无法解析的行
            }
        }
    }
}
