import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

type Ctx = {
    auth: { getUserIdentity: () => Promise<{
        subject: string;
        organization_id?: string;
    } | null> };
    db: {
        get: (id: Id<"chatConversations">) => Promise<{
            ownerId: string;
            organizationId?: string;
        } | null>;
    };
};

async function assertConversationOwner(ctx: Ctx, conversationId: Id<"chatConversations">) {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
        throw new ConvexError("Unauthorized");
    }
    const organizationId = (user.organization_id ?? undefined) as string | undefined;
    const conv = await ctx.db.get(conversationId);
    if (!conv) {
        throw new ConvexError("Conversation not found");
    }
    const isOwner = conv.ownerId === user.subject;
    const isOrg =
        !!(conv.organizationId && organizationId && conv.organizationId === organizationId);
    if (!isOwner && !isOrg) {
        throw new ConvexError("Unauthorized");
    }
    return { user, organizationId, conv };
}

export const createChatConversation = mutation({
    args: { title: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) {
            throw new ConvexError("Unauthorized");
        }
        const organizationId = (user.organization_id ?? undefined) as string | undefined;
        const now = Date.now();
        const title = (args.title?.trim() || "新对话").slice(0, 200);
        return await ctx.db.insert("chatConversations", {
            ownerId: user.subject,
            organizationId,
            title,
            updatedAt: now,
        });
    },
});

export const appendChatMessage = mutation({
    args: {
        conversationId: v.id("chatConversations"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
    },
    handler: async (ctx, { conversationId, role, content }) => {
        await assertConversationOwner(ctx, conversationId);
        const now = Date.now();
        const msgId = await ctx.db.insert("chatMessages", {
            conversationId,
            role,
            content,
            createdAt: now,
        });
        await ctx.db.patch(conversationId, { updatedAt: now });
        return msgId;
    },
});

export const renameChatConversation = mutation({
    args: { conversationId: v.id("chatConversations"), title: v.string() },
    handler: async (ctx, { conversationId, title }) => {
        await assertConversationOwner(ctx, conversationId);
        await ctx.db.patch(conversationId, {
            title: title.trim().slice(0, 200),
            updatedAt: Date.now(),
        });
    },
});

export const deleteChatConversation = mutation({
    args: { conversationId: v.id("chatConversations") },
    handler: async (ctx, { conversationId }) => {
        await assertConversationOwner(ctx, conversationId);
        const msgs = await ctx.db
            .query("chatMessages")
            .withIndex("by_conversation_created", (q) =>
                q.eq("conversationId", conversationId)
            )
            .collect();
        for (const m of msgs) {
            await ctx.db.delete(m._id);
        }
        await ctx.db.delete(conversationId);
    },
});

export const listChatConversations = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, { limit }) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) {
            throw new ConvexError("Unauthorized");
        }
        const take = Math.min(Math.max(limit ?? 40, 1), 100);

        return await ctx.db
            .query("chatConversations")
            .withIndex("by_owner_updated", (q) => q.eq("ownerId", user.subject))
            .order("desc")
            .take(take);
    },
});

export const listChatMessages = query({
    args: { conversationId: v.id("chatConversations") },
    handler: async (ctx, { conversationId }) => {
        await assertConversationOwner(ctx, conversationId);
        return await ctx.db
            .query("chatMessages")
            .withIndex("by_conversation_created", (q) =>
                q.eq("conversationId", conversationId)
            )
            .order("asc")
            .take(500);
    },
});
