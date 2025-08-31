/**
 * 文章推荐组件 - 在聊天中显示推荐的文章
 */

"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, User, Tag, TrendingUp, ExternalLink } from 'lucide-react';
import { ArticleProps } from '@/constants/interfaces';

// 文章推荐项接口
export interface ArticleRecommendationItem {
  article: ArticleProps;
  relevanceScore: number;
  matchedKeywords: string[];
}

// 组件属性接口
interface ArticleRecommendationProps {
  recommendations: ArticleRecommendationItem[];
  className?: string;
}

// 单个文章推荐卡片
const ArticleRecommendationCard: React.FC<{
  recommendation: ArticleRecommendationItem;
  index: number;
}> = ({ recommendation, index }) => {
  const router = useRouter();
  const { article, relevanceScore, matchedKeywords } = recommendation;

  const handleViewArticle = () => {
    router.push(`/smartcampus/articles/${article.id}`);
  };

  return (
    <Card className="w-full hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold text-gray-800 line-clamp-2 flex-1">
            {article.title}
          </CardTitle>
          <Badge variant="secondary" className="ml-2 text-xs">
            {Math.round(relevanceScore * 100)}% 匹配
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* 文章信息 */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User size={14} />
              <span>{article.introduction.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Tag size={14} />
              <span>{article.introduction.label}</span>
            </div>
          </div>

          {/* 匹配关键词 */}
          {matchedKeywords.length > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-500" />
              <div className="flex flex-wrap gap-1">
                {matchedKeywords.slice(0, 3).map((keyword, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs px-2 py-0.5">
                    {keyword}
                  </Badge>
                ))}
                {matchedKeywords.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    +{matchedKeywords.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <BookOpen size={12} />
              <span>第 {index + 1} 推荐</span>
            </div>
            <Button
              onClick={handleViewArticle}
              size="sm"
              className="h-8 px-3 text-xs"
              variant="default"
            >
              <ExternalLink size={12} className="mr-1" />
              查看文章
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 主要的文章推荐组件
const ArticleRecommendation: React.FC<ArticleRecommendationProps> = ({
  recommendations,
  className = ""
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b pb-2">
        <BookOpen size={16} className="text-blue-500" />
        <span>相关文章推荐</span>
        <Badge variant="secondary" className="text-xs">
          {recommendations.length} 篇
        </Badge>
      </div>

      {/* 推荐列表 */}
      <div className="space-y-3">
        {recommendations.map((recommendation, index) => (
          <ArticleRecommendationCard
            key={recommendation.article.id}
            recommendation={recommendation}
            index={index}
          />
        ))}
      </div>

      {/* 底部提示 */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t">
        💡 点击文章卡片可以查看完整内容
      </div>
    </div>
  );
};

export default ArticleRecommendation;