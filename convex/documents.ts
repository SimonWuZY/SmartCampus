import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server"
import { mutation, query } from "./_generated/server";

export const getDocumentsByIds = query({
    args: { ids: v.array(v.id("documents")) },
    handler: async (ctx, { ids }) => {
        const documents = [];

        for (const id of ids) {
            const document = await ctx.db.get(id);
            if (document) {
                documents.push({ id: document._id, name: document.title });
            }
            else {
                documents.push({ id, name: "[Removed]" });
            }
        }
        return documents;
    }
})

export const createDocument = mutation({
    args: { title: v.optional(v.string()), initialContent: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();

        if (!user) {
            throw new ConvexError("Unathorized");
        }

        const organizationId = (user.organization_id ?? undefined) as
            | string
            | undefined;

        return await ctx.db.insert("documents", {
            title: args.title ?? "未命名的文档",
            ownerId: user.subject,
            organizationId,
            initialContent: args.initialContent,
        });
    },
})

// 默认查询出所有相关的文档
export const getDocuments = query({
    args: { paginationOpts: paginationOptsValidator, search: v.optional(v.string()) },
    // 这里直接结构传参 
    handler: async (ctx, { search, paginationOpts }) => {
        const user = await ctx.auth.getUserIdentity();

        if (!user) {
            throw new ConvexError("Unauthorized");
        }

        const organizationId = (user.organization_id ?? undefined) as
            | string
            | undefined;

        // 组织搜索 
        if (search && organizationId) {
            return await ctx.db
                .query("documents")
                .withSearchIndex("search_title", (q) =>
                    q.search("title", search).eq("organizationId", organizationId)
                )
                .paginate(paginationOpts)
        }
        // 个人搜索
        else if (search) {
            return await ctx.db
                .query("documents")
                .withSearchIndex("search_title", (q) =>
                    q.search("title", search).eq("ownerId", user.subject))
                .paginate(paginationOpts)
        }

        // 组织
        if (organizationId) {
            return await ctx.db.query("documents")
                .withIndex("by_organization_id", (q) => q.eq("organizationId", organizationId))
                .paginate(paginationOpts);
        }

        // 个人
        return await ctx.db.query("documents")
            .withIndex("by_owner_id", (q) => q.eq("ownerId", user.subject))
            .paginate(paginationOpts);
    },
});

export const removeDocumentById = mutation({
    args: { id: v.id("documents") },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();

        if (!user) {
            throw new ConvexError("Unauthorized");
        }

        const organizationId = (user.organization_id ?? undefined) as
            | string
            | undefined;

        const document = await ctx.db.get(args.id);

        if (!document) {
            throw new ConvexError("Document not found");
        }

        const isOwner = document.ownerId === user.subject;
        const isOrganizationMember =
            !!(document.organizationId && document.organizationId === organizationId);

        if (!isOwner && !isOrganizationMember) {
            throw new ConvexError("Unauthorized");
        }

        return await ctx.db.delete(args.id);
    }
})

export const updateDocumentById = mutation({
    args: { id: v.id("documents"), title: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();

        if (!user) {
            throw new ConvexError("Unauthorized");
        }
        const organizationId = (user.organization_id ?? undefined) as
            | string
            | undefined;

        const document = await ctx.db.get(args.id);

        if (!document) {
            throw new ConvexError("Document not found");
        }

        const isOwner = document.ownerId === user.subject;
        const isOrganizationMember =
            !!(document.organizationId && document.organizationId === organizationId);

        if (!isOwner && !isOrganizationMember) {
            throw new ConvexError("Unauthorized");
        }

        return await ctx.db.patch(args.id, { title: args.title });
    }
})

export const getDocumentById = query({
    args: { id: v.id("documents") },
    handler: async (ctx, { id }) => {
        const document = await ctx.db.get(id);

        if (!document) {
            throw new ConvexError("未找到所需文档");
        }

        return document;
    },
});

/**
 * 将智能助手生成的纯文本整理为最小 TipTap JSON 并新建文档（不修改原文 JSON，避免破坏 Liveblocks 协同内容）。
 */
export const createAssistantWriteupDocument = mutation({
    args: {
        title: v.string(),
        plainBody: v.string(),
    },
    handler: async (ctx, { title, plainBody }) => {
        const user = await ctx.auth.getUserIdentity();

        if (!user) {
            throw new ConvexError("Unauthorized");
        }

        const organizationId = (user.organization_id ?? undefined) as
            | string
            | undefined;

        const chunks = plainBody.slice(0, 60_000).split(/\n\n+/);
        const paragraphs =
            chunks.length > 0
                ? chunks.map((text) => ({
                      type: "paragraph" as const,
                      content: [
                          {
                              type: "text" as const,
                              text: text.replace(/\n+/g, " ").slice(0, 12_000),
                          },
                      ],
                  }))
                : [
                      {
                          type: "paragraph" as const,
                          content: [{ type: "text" as const, text: "(无内容)" }],
                      },
                  ];

        const tipTapJson = JSON.stringify({
            type: "doc",
            content: paragraphs,
        });

        return await ctx.db.insert("documents", {
            title: title.slice(0, 200),
            ownerId: user.subject,
            organizationId,
            initialContent: tipTapJson,
        });
    },
});