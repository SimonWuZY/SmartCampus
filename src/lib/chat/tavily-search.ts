export type WebSearchHit = {
    title: string;
    url: string;
    snippet: string;
};

export type WebSearchResult = {
    query: string;
    results: WebSearchHit[];
    skipped?: boolean;
    skipReason?: string;
};

/**
 * 联网检索（Tavily）。未配置 TAVILY_API_KEY 时返回 skipped，由上层决定是否仍生成回答。
 * @see https://docs.tavily.com/documentation/api-reference/endpoint/search
 */
export async function searchWebWithTavily(query: string): Promise<WebSearchResult> {
    const apiKey = process.env.TAVILY_API_KEY;
    const trimmed = query.trim().slice(0, 400);
    if (!trimmed) {
        return { query: "", results: [], skipped: true, skipReason: "empty_query" };
    }
    if (!apiKey) {
        return {
            query: trimmed,
            results: [],
            skipped: true,
            skipReason: "missing_TAVILY_API_KEY",
        };
    }

    const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            api_key: apiKey,
            query: trimmed,
            search_depth: "basic",
            max_results: 6,
            include_answer: false,
        }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Tavily HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
        results?: Array<{ title?: string; url?: string; content?: string }>;
    };
    const results: WebSearchHit[] = (data.results ?? []).map((r) => ({
        title: r.title ?? "无标题",
        url: r.url ?? "",
        snippet: (r.content ?? "").slice(0, 500),
    }));

    return { query: trimmed, results };
}

export function formatSearchHitsForPrompt(hits: WebSearchHit[]): string {
    if (!hits.length) return "";
    return hits
        .map((h, i) => `### [${i + 1}] ${h.title}\n链接: ${h.url}\n摘要: ${h.snippet}\n`)
        .join("\n");
}
