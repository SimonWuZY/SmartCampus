"use client"
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { templates } from "@/constants/templates";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { useIsMobile } from "@/hooks/use-mobile";


export const TemplatesGallery = () => {
    const router = useRouter();
    const isMobile = useIsMobile();
    const createDocument = useMutation(api.documents.createDocument);
    const [isCreating, setIsCreating] = useState(false);

    const onTemplateClick = (title: string, initialContent: string) => {
        setIsCreating(true);
        createDocument({ title, initialContent })
            .catch(() => toast.error("出现了一些问题"))
            .then((documentId) => {
                router.push(`/documents/${documentId}`);
                toast.success("文档创建成功！");
            })
            .finally(() => {
                setIsCreating(false);
            })
    }

    return (
        <div className="bg-[#F1F3F4]">
            {isMobile && (<div className="flex items-center justify-center gap-4 py-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 font-bold text-2xl">
                    开始一篇新文档
                </span>
                <OrganizationSwitcher
                    afterCreateOrganizationUrl="/"
                    afterLeaveOrganizationUrl="/"
                    afterSelectOrganizationUrl="/"
                    afterSelectPersonalUrl="/"
                />
            </div>)}

            <div className="max-w-screen-xl mx-auto px-16 flex flex-col gap-y-4">

                <Carousel>
                    <CarouselContent className="-ml-4">
                        {templates.map((template) =>
                            <CarouselItem
                                key={template.id}
                                className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-[14.285714%] pl-4"
                            >
                                <div
                                    className={cn(
                                        "aspect-[3/4] flex flex-col gap-y-2.5",
                                        isCreating && "pointer-events-none opacity-50"
                                    )}
                                >
                                    <button
                                        disabled={isCreating}
                                        onClick={() => onTemplateClick(template.label, template.initialContent)}
                                        style={{
                                            backgroundImage: `url(${template.imageUrl})`,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            backgroundRepeat: "no-repeat",
                                        }}
                                        className="size-full hover:border-blue-500 rounded-md border hover:bg-blue-50 transition flex flex-col items-center justify-center  gap-y-4 bg-white"
                                    />
                                    <p className="text-sm font-medium truncate">
                                        {template.label}
                                    </p>
                                </div>
                            </CarouselItem>
                        )}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>
        </div>
    )
}