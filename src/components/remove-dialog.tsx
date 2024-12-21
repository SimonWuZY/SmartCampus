"use client"
import { useState } from "react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
// import { useRouter } from "next/navigation";

interface RemoveDialogProps {
    documentId: Id<"documents">;
    children: React.ReactNode;
};

export const RemoveDialog = ({ documentId, children }: RemoveDialogProps) => {
    // const router = useRouter();
    const remove = useMutation(api.documents.removeDocumentById);
    const [isRemoving, setIsRemoving] = useState(false);

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>你确认删除此文档吗</AlertDialogTitle>
                    <AlertDialogDescription>
                        此操作将永久性从你的账号上删除此文档
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                        取消
                    </AlertDialogCancel>
                    <AlertDialogAction
                        disabled={isRemoving}
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsRemoving(true);
                            remove({ id: documentId })
                                .catch(() => toast.error("出现了一些问题"))
                                .then(() => {
                                    toast.success("文档删除成功！")
                                    // FIXME: 删除文档重定向到首页
                                    //  原因是删除后找不到文档的捕获 error 先于重定向
                                    // router.push("/");
                                })
                                .finally(() => setIsRemoving(false));
                        }}

                    >
                        删除
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
} 