import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const MAX_CHARS_PER_DOC = 12_000;

/**
 * 拉取用户有权访问的文档节选（Convex initialContent），用于 doc_link 分支。
 */
export async function loadAuthorizedDocumentsContext(
    convexToken: string,
    documentIds: string[],
    userId: string,
    orgId: string | undefined
): Promise<string> {
    if (!documentIds.length) return "";

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(convexToken);

    const parts: string[] = [];
    for (const rawId of documentIds) {
        try {
            const doc = await convex.query(api.documents.getDocumentById, {
                id: rawId as Id<"documents">,
            });
            const isOwner = doc.ownerId === userId;
            const isOrg =
                !!(doc.organizationId && orgId && doc.organizationId === orgId);
            if (!isOwner && !isOrg) {
                parts.push(`\n### 文档 ${rawId}\n（无权访问）\n`);
                continue;
            }
            const body = (doc.initialContent ?? "").slice(0, MAX_CHARS_PER_DOC);
            parts.push(`\n### 《${doc.title}》（id: ${doc._id}）\n\n${body}\n`);
        } catch {
            parts.push(`\n### 文档 ${rawId}\n（不存在或无法读取）\n`);
        }
    }
    return parts.join("\n---\n");
}
