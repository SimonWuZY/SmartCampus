import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const fetchArticles = async () => {
    const articles = await convex.query(api.articles.getAllArticles);
    return articles;
}