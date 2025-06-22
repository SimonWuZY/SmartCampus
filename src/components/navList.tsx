import { useRouter } from "next/navigation";

export const NavList = () => {
    const router = useRouter();


    return (
        <div>
            <span onClick={() => router.push("/smartcampus/documents")}>
                文档
            </span>
            <span onClick={() => router.push("/smartcampus/")}>
                文章
            </span>
            <span onClick={() => router.push("/smartcampus/chat")}>
                问答
            </span>
        </div>
    )
}