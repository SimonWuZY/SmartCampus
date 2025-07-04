"use client"
import React from 'react';
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThumbsUp, MessageCircle } from 'lucide-react';
import { ArticleProps } from '@/constants/interfaces';
import { SideNavigatar } from './side-navigatar';

const ArticleCard: React.FC<{ article: ArticleProps }> = ({ article }) => {
    const router = useRouter();

    const handleEnterArticlesClick = () => {
        router.push(`/smartcampus/articles/${article.id}`);
    };

    return (
        <Card
            onClick={handleEnterArticlesClick}
            className="w-full h-36 relative p-1 cursor-pointer hover:shadow-lg transition-shadow duration-200"
        >
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{article.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-hidden">
                    <p className="text-sm text-gray-600 mb-1">{article.introduction.author}</p>
                    <p className="text-sm text-gray-500 mb-2">{article.introduction.label}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <ThumbsUp size={16} />
                        <span>{article.introduction.likeNumber}</span>
                        <MessageCircle size={16} />
                        <span>{article.introduction.commentNumber}</span>
                    </div>
                </div>
                {article.cover && (
                    <img
                        src={article.cover}
                        alt="cover"
                        className="w-24 h-auto rounded-lg absolute top-4 right-4 object-cover"
                    />
                )}
            </CardContent>
        </Card>
    );
};

const ArticlesOverview: React.FC<{ articles?: ArticleProps[] }> = ({ articles }) => {
    return (
        <div className="relative w-full min-h-screen flex flex-row">
            {/* 左侧导航栏 */}
            <div className="sticky top-4 h-screen flex items-center justify-center w-32">
                <SideNavigatar />
            </div>

            {/* 中间文章区域 */}
            <div className="flex-1 flex flex-col gap-4 px-8">
                {articles && articles.length > 0 ? (
                    articles.map(article => (
                        <ArticleCard key={article.id} article={article} />
                    ))
                ) : (
                    <p className="text-center text-gray-500 mt-8">暂无文章</p>
                )}
            </div>

            {/* 右侧导航栏 */}
            <div className="sticky top-4 h-screen flex items-center justify-center w-32">
                <SideNavigatar />
            </div>
        </div>
    );
};

export default ArticlesOverview;