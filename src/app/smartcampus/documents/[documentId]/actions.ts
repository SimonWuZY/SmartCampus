"use server"
import { ConvexHttpClient } from "convex/browser";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function getDocuments(ids: Id<"documents">[]) {
    return await convex.query(api.documents.getDocumentsByIds, { ids });
}

export async function getUsers() {
    const { sessionClaims } = await auth();
    const clerk = await clerkClient();

    const response = await clerk.users.getUserList({
        organizationId: [sessionClaims?.org_id as string],

    });

    const users = response.data.map((user) => ({
        id: user.id,
        name: user.username ?? user.primaryEmailAddress?.emailAddress ?? "匿名用户",
        avatar: user.imageUrl,
        color: "",
    }))

    return users;
}