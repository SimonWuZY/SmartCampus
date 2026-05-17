/**
 * 从用户消息中解析站内协同文档链接，得到 Convex documents 表 id。
 * 匹配形如 /smartcampus/documents/<id> 的路径（可带域名）。
 */
const DOCUMENT_PATH_RE = /\/smartcampus\/documents\/([a-z0-9]+)/gi;

export function extractDocumentIdsFromMessage(text: string): string[] {
    const seen = new Set<string>();
    for (const match of text.matchAll(DOCUMENT_PATH_RE)) {
        const id = match[1];
        if (id) seen.add(id);
    }
    return [...seen];
}
