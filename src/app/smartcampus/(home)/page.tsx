"use client";

import React, { useEffect, useState } from "react";
import { NavListEnum } from "@/constants/interfaces";
import BottomNavBar from "@/components/bottom-narbar";
import ArticlesOverview from "./articles";
import { fetchArticles } from "../../api/servers/indexFetch";
import { ArticleProps } from '@/constants/interfaces';
import RootNavBar from "@/components/rootNavbar";
import { FullscreenLoader } from "@/components/fullscreen-loader";

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
        {/* <HomeNavBar /> */}
        <RootNavBar searchItem={NavListEnum.ARTICLES}></RootNavBar>
      </div>

      {/* 主内容区域 */}
      <div className="mt-16 p-4 flex-1 flex justify-center">
        <div className="w-full max-w-[70vw]">
          {/* TODO: 整个页面包在加载状态里面 */}
          {loading && <FullscreenLoader label="文章拼命加载中..." />}
          {error && <p className="text-red-500 text-center">{error}</p>}
          {!loading && !error && <ArticlesOverview articles={articles} />}
        </div>
      </div>

      {/* 底部导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-10 h-16 bg-white p-4 shadow-md">
        <BottomNavBar />
      </div>
    </div>
  );
};

export default HomePage;