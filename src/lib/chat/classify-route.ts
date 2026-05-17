import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createDeepseekChatModel } from "./deepseek-model";

export type ChatStreamRoute = "general" | "math" | "doc_link";

/**
 * 无站内文档链接时：由模型区分数学 / 通用。（含文档链接时在 API 层直接走 doc_link，不调用本函数。）
 */
export async function classifyChatRoute(message: string): Promise<"general" | "math"> {
    const model = createDeepseekChatModel({ temperature: 0 });
    const text = await model.invoke([
        new SystemMessage(
            `你是路由模块。只输出一个 JSON 对象，不要 Markdown、不要解释。
字段 route 取值只能是 "math" 或 "general"。
- math：数学相关（中小学/大学数学、竞赛、奥数、解方程、证明、计算、应用题中明确以数学求解为主）。
- general：闲聊、编程、写作、其它学科、或无法判断为数学求解。`
        ),
        new HumanMessage(message.slice(0, 6000)),
    ]);
    const raw = typeof text.content === "string" ? text.content : JSON.stringify(text.content);
    try {
        const m = raw.match(/\{[\s\S]*?"route"[\s\S]*?\}/);
        const j = JSON.parse(m?.[0] ?? "{}") as { route?: string };
        return j.route === "math" ? "math" : "general";
    } catch {
        return "general";
    }
}
