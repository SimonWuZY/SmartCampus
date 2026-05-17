import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    documents: defineTable({
        title: v.string(),
        initialContent: v.optional(v.string()),
        ownerId: v.string(),
        roomId: v.optional(v.string()),
        organizationId: v.optional(v.string()),
    })
        .index("by_owner_id", ["ownerId"])
        .index("by_organization_id", ["organizationId"])
        .searchIndex("search_title", {
            searchField: "title",
            filterFields: ["ownerId", "organizationId"],
        }),
    articles: defineTable({
        title: v.string(),
        introduction: v.object({
            author: v.string(),
            data: v.string(),
            label: v.string(),
            likeNumber: v.number(),
            commentNumber: v.number(),
        }),
        cover: v.optional(v.string()),
        content: v.string(),
    }),

    /** 智能助手会话（按用户 / 组织隔离） */
    chatConversations: defineTable({
        ownerId: v.string(),
        organizationId: v.optional(v.string()),
        title: v.string(),
        updatedAt: v.number(),
    }).index("by_owner_updated", ["ownerId", "updatedAt"]),

    /** 会话内消息（用户与助手 Markdown 正文） */
    chatMessages: defineTable({
        conversationId: v.id("chatConversations"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        createdAt: v.number(),
    }).index("by_conversation_created", ["conversationId", "createdAt"]),
});

