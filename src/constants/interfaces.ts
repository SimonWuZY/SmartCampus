export interface ArticleIntroProps {
    author: string;
    data: string;
    label: string;
    likeNumber: number;
    commentNumber: number;
}

export interface ArticleProps {
    id: string;
    title: string;
    introduction: ArticleIntroProps;
    cover?: string;
    content: string;
}

export enum NavListEnum {
    DOCUMENTS = "协同文档",
    ARTICLES = "文章推送",
    CHAT = "智能助手",
}

export interface NavListProps {
    searchItem: NavListEnum;
}