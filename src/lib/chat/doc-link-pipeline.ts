import { extractDocumentIdsFromMessage } from "./extract-document-ids";
import { loadAuthorizedDocumentsContext } from "./load-documents-context";
import {
    formatSearchHitsForPrompt,
    searchWebWithTavily,
} from "./tavily-search";
import { streamDeepseekChatCompletion } from "./deepseek-stream";
import { completeDeepseekChat } from "./deepseek-complete";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

export type SseSend = (obj: unknown) => void;

function firstDocTitleFromBlock(docBlock: string): string | undefined {
    const m = docBlock.match(/###\s*《([^》]+)》/);
    return m?.[1]?.trim();
}

/**
 * 含站内文档链接时的多阶段编排（SSE 事件驱动，前端可扩展展示 agent 进度）。
 *
 * 顺序：Doc Parser → Doc Solver（流式）→ Search Agent → Summarizer（流式）→ Writer（生成可入库正文）→ 新建协同文档（TipTap JSON，避免破坏原文 JSON）
 */
export async function runDocLinkAgentPipeline(options: {
    message: string;
    userId: string;
    orgId: string | undefined;
    convexToken: string;
    send: SseSend;
}): Promise<void> {
    const { message, userId, orgId, convexToken, send } = options;

    send({ type: "agent", id: "doc_parser", phase: "start" });
    const ids = extractDocumentIdsFromMessage(message);
    send({ type: "documents", ids });

    const docBlock = await loadAuthorizedDocumentsContext(
        convexToken,
        ids,
        userId,
        orgId
    );
    send({
        type: "agent",
        id: "doc_parser",
        phase: "done",
        charCount: docBlock.length,
        linkedCount: ids.length,
    });

    const docSolverSystem = `你是「文档解题助手」。用户消息里包含站内协同文档节选（Markdown/纯文本摘录）。请严格基于节选回答用户问题，使用 **Markdown**。
若节选不足以作答，明确说明缺什么信息，不要编造节选里没有的内容。可包含必要公式（$...$ 或 $$...$$）。`;

    let solverFull = "";
    send({ type: "agent", id: "doc_solver", phase: "start" });
    for await (const piece of streamDeepseekChatCompletion({
        system: docSolverSystem,
        user: `${message}\n\n---\n## 文档节选\n${docBlock || "（未能加载到有权访问的文档内容）"}\n`,
        temperature: 0.3,
    })) {
        if (piece) {
            solverFull += piece;
            send({ type: "delta", text: piece });
        }
    }
    send({ type: "agent", id: "doc_solver", phase: "done" });

    let searchBlock = "";
    send({ type: "search", phase: "start" });
    const docTitleHint = firstDocTitleFromBlock(docBlock) ?? "";
    const searchQuery = `${message.slice(0, 240)} ${docTitleHint} 相关题目 习题 知识点`.trim();
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

    send({ type: "agent", id: "summarizer", phase: "start" });
    const summarizerUser = `【用户原问】\n${message}\n\n【基于文档的主答】\n${solverFull}\n\n【联网检索摘要】\n${searchBlock || "（无检索结果或未配置搜索）"}\n`;

    for await (const piece of streamDeepseekChatCompletion({
        system: `你是「总结与助学」助手。请用 **Markdown** 完成：
1. **总览**：用几句话概括题意与结论。
2. **与文档主答的对照**：指出关键步骤与易错点。
3. **与联网资料的对照**：列出可参考链接（仅使用摘要中出现的真实 URL），说明「仅供参考」。
4. **互动**：结尾用 1～2 句友善反问，询问用户是否理解、或希望展开哪一步（例如某公式或某一步推导）。

语气自然、教学向。不要重复粘贴整篇主答。`,
        user: summarizerUser,
        temperature: 0.35,
        maxTokens: 4096,
    })) {
        if (piece) send({ type: "delta", text: piece });
    }
    send({ type: "agent", id: "summarizer", phase: "done" });

    const autoWrite = process.env.CHAT_DOC_AUTO_WRITE !== "0";
    if (!autoWrite) {
        send({ type: "writeDoc", skipped: true, reason: "CHAT_DOC_AUTO_WRITE=0" });
        return;
    }

    send({ type: "agent", id: "writer", phase: "start" });
    let archiveBody: string;
    try {
        archiveBody = await completeDeepseekChat({
            system: `你是「写文档」助手。请输出一段适合作为学习笔记保存的正文（可用 Markdown 标题与列表，但不要外层代码块围栏）。
结构建议：
## 题意与结论摘要
## 解题框架与关键步骤
## 知识点清单
## 延伸阅读（仅列出用户上下文中已出现的链接，勿编造）
保持精炼，总字数建议 800～2500 字。`,
            user: `用户问题：\n${message.slice(0, 4000)}\n\n--- 主答 ---\n${solverFull.slice(0, 12000)}\n\n--- 联网摘要 ---\n${searchBlock.slice(0, 8000)}`,
            temperature: 0.25,
            maxTokens: 4096,
        });
    } catch (e) {
        send({
            type: "agent",
            id: "writer",
            phase: "error",
            message: e instanceof Error ? e.message : String(e),
        });
        send({ type: "writeDoc", skipped: true, reason: "writer_llm_failed" });
        return;
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(convexToken);

    const titleBase = docTitleHint || "智能助手整理";
    const title = `${titleBase} · 学习纪要`;

    try {
        const newId = await convex.mutation(api.documents.createAssistantWriteupDocument, {
            title: title.slice(0, 120),
            plainBody: archiveBody.slice(0, 60_000),
        });
        send({ type: "agent", id: "writer", phase: "done" });
        send({
            type: "writeDoc",
            skipped: false,
            createdDocumentId: newId,
            title,
        });
    } catch (e) {
        send({
            type: "agent",
            id: "writer",
            phase: "error",
            message: e instanceof Error ? e.message : String(e),
        });
        send({ type: "writeDoc", skipped: true, reason: "convex_mutation_failed" });
    }
}
