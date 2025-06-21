import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import Content from "./article-content";
import Navbar from "./article-navbar";
import { ArticleIntroProps } from "@/constants/interfaces";
import Outline from "./article-outline";

interface ArticleIdPageProps {
    params: Promise<{ articleId: Id<"articles"> }>;
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const ArticlePage = async ({ params }: ArticleIdPageProps) => {
    const { articleId } = await params;

    const article = await convex.query(api.articles.getArticleById, { id: articleId });

    if (!article) {
        return <p>Article not found</p>;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <Outline
                title={article.title}
                introduction={article.introduction as ArticleIntroProps}
            />
            <Content content={article.content} />
        </div>
    );
};


export default ArticlePage;