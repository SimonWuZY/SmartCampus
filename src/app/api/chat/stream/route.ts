import { auth, currentUser } from "@clerk/nextjs/server";
import { extractDocumentIdsFromMessage } from "@/lib/chat/extract-document-ids";
import { classifyChatRoute } from "@/lib/chat/classify-route";
import {
    formatSearchHitsForPrompt,
    searchWebWithTavily,
} from "@/lib/chat/tavily-search";
import { streamDeepseekChatCompletion } from "@/lib/chat/deepseek-stream";
import { sseDataLine } from "@/lib/chat/sse";
import { runDocLinkAgentPipeline } from "@/lib/chat/doc-link-pipeline";

export const runtime = "nodejs";

function buildSystemPrompt(route: "general" | "math", searchBlock: string): string {
    const base =
        "请始终使用 **Markdown** 输出（标题、列表、公式可用 LaTeX $...$ 或 $$...$$）。不要输出与要求无关的前置说明。";

    if (route === "general") {
        return `${base}\n你是通用助手，回答清晰、可执行。`;
    }

    return `${base}
你是数学解题助手。
1. 先给出**主要解答**（步骤完整）。
2. 若下方提供「联网检索摘要」，请新增小节「## 相关题目与参考来源」，用列表列出可核对的链接与简要说明；**不要编造**未出现在摘要中的链接。
3. 若检索结果与用户题不完全一致，请明确说明「仅供参考」。

${searchBlock ? `---\n## 联网检索摘要（Search Agent）\n${searchBlock}\n---\n` : "（当前无联网检索结果或未配置搜索密钥。）\n"}`;
}

export async function POST(req: Request) {
    const user = await currentUser();
    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { getToken } = await auth();
    const convexToken = await getToken({ template: "convex" });
    if (!convexToken) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    let body: { message?: string };
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const message = typeof body.message === "string" ? body.message : "";
    if (!message.trim()) {
        return new Response(JSON.stringify({ error: "Empty message" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
        return new Response(JSON.stringify({ error: "DEEPSEEK_API_KEY is not configured" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { sessionClaims } = await auth();
    const orgId = sessionClaims?.org_id as string | undefined;

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            const send = (obj: unknown) => controller.enqueue(sseDataLine(obj));
            try {
                const route = extractDocumentIdsFromMessage(message).length
                    ? ("doc_link" as const)
                    : await classifyChatRoute(message);

                send({ type: "meta", route });

                if (route === "doc_link") {
                    await runDocLinkAgentPipeline({
                        message,
                        userId: user.id,
                        orgId,
                        convexToken,
                        send,
                    });
                    send({ type: "done" });
                    return;
                }

                let searchBlock = "";
                const runSearch = route === "math";
                if (runSearch) {
                    send({ type: "search", phase: "start" });
                    const searchQuery = `${message.slice(0, 360)} 类似题目 数学 题解`;
                    try {
                        const web = await searchWebWithTavily(searchQuery);
                        send({
                            type: "search",
                            phase: "done",
                            query: web.query,
                            skipped: web.skipped,
                            skipReason: web.skipReason,
                            results: web.results,
                        });
                        searchBlock = formatSearchHitsForPrompt(web.results);
                    } catch (e) {
                        send({
                            type: "search",
                            phase: "error",
                            message: e instanceof Error ? e.message : String(e),
                        });
                    }
                }

                const system = buildSystemPrompt(route, searchBlock);
                const temp = route === "math" ? 0.25 : 0.55;

                for await (const text of streamDeepseekChatCompletion({
                    system,
                    user: message,
                    temperature: temp,
                })) {
                    if (text) send({ type: "delta", text });
                }

                send({ type: "done" });
            } catch (e) {
                send({
                    type: "error",
                    message: e instanceof Error ? e.message : String(e),
                });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
