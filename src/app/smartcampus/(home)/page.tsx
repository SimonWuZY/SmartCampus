"use client";

import React, { useEffect, useState } from "react";
import HomeNavBar from "./home-navbar";
import BottomNavBar from "@/components/bottom-narbar";
import ArticlesOverview from "./articles";
import { fetchArticles } from "../../api/servers/indexFetch";
import { ArticleProps } from '@/constants/interfaces';

const HomePage = () => {
  const [articles, setArticles] = useState<ArticleProps[]>(); // 用于存储文章数据
  const [loading, setLoading] = useState(true); // 加载状态
  const [error, setError] = useState<string | null>(null); // 错误状态

  // 使用 useEffect 获取文章数据
  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        const fetchedArticles = await fetchArticles();
        setArticles(fetchedArticles);
      } catch (err: unknown) {
        setError("Failed to load articles. Please try again later. error: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <div className="fixed top-0 left-0 right-0 z-10 h-16 bg-white p-4 shadow-md">
        <HomeNavBar />
      </div>

      {/* 主内容区域 */}
      <div className="mt-16 p-4 flex-1">
        {loading && <p>Loading articles...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && <ArticlesOverview articles={articles} />}
      </div>

      {/* 底部导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-10 h-16 bg-white p-4 shadow-md">
        <BottomNavBar />
      </div>
    </div>
  );
};

export default HomePage;