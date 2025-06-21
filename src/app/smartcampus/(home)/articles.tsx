"use client"
import React from 'react';
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThumbsUp, MessageCircle } from 'lucide-react'; // Importing icons from lucide-react
import { ArticleProps } from '@/constants/interfaces';

const ArticleCard: React.FC<{ article: ArticleProps }> = ({ article }) => {
    const router = useRouter();

    const handleEnterArticlesClick = () => {
        router.push(`/smartcampus/articles/${article.id}`);
    };

    return (
        <Card onClick={handleEnterArticlesClick} style={{ width: '100%', height: 'auto', position: 'relative', padding: '16px', cursor: 'pointer' }}>
            <CardHeader>
                <CardTitle>{article.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div style={{ overflow: 'hidden' }}>
                    <p>{article.introduction.author}</p>
                    <p>{article.introduction.label}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ThumbsUp size={16} />
                        <span>{article.introduction.likeNumber}</span>
                        <MessageCircle size={16} />
                        <span>{article.introduction.commentNumber}</span>
                    </div>
                </div>
                {article.cover && (
                    <img src={article.cover} alt="cover" style={{ width: '100px', height: 'auto', borderRadius: '8px', position: 'absolute', top: '16px', right: '16px' }} />
                )}
            </CardContent>
        </Card>
    );
};

const ArticlesOverview: React.FC<{ articles?: ArticleProps[] }> = ({ articles }) => {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px' }}>
            {articles && articles.length > 0 ? (
                articles.map(article => (
                    <ArticleCard key={article.id} article={article} />
                ))
            ) : (
                <p>No articles available.</p>
            )}
        </div>
    );
};

export default ArticlesOverview;