import { preloadQuery } from "convex/nextjs";
import { auth } from "@clerk/nextjs/server"

import { Id } from "../../../../convex/_generated/dataModel"
import { Document } from "./document";
import { api } from "../../../../convex/_generated/api";

interface DocumentIdPageProps {
    params: Promise<{ documentId: Id<"documents"> }>;
};

const DocumentIdPage = async ({ params }: DocumentIdPageProps) => {
    // console.log(params);
    const { documentId } = await params;
    // console.log(documentId);
    const { getToken } = await auth();
    const token = await getToken({ template: "convex" }) ?? undefined;

    if (!token) {
        throw new Error("Unauthorized");
    }

    const preloadedDocument = await preloadQuery(
        api.documents.getDocumentById,
        { id: documentId },
        { token }
    )

    if (!preloadedDocument) {
        throw new Error("未找到所需文档");
    }

    return (
        <Document preloadedDocument={preloadedDocument} />
    )
}

export default DocumentIdPage; 