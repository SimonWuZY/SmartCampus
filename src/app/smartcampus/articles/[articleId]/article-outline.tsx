import React from 'react';
import { ArticleIntroProps } from '@/constants/interfaces';

interface OutlineProps {
    title: string;
    introduction: ArticleIntroProps;
}

const Outline = ({ title, introduction }: OutlineProps) => {
    return (
        <div className="p-4 border-b">
            <h1 className="text-4xl font-bold text-gray-800">{title}</h1>
            <div className="flex items-center mt-2">
                {/* 如果有作者头像，可以取消注释以下代码 */}
                {/* <img src={introduction.authorAvatar} alt="author" className="w-10 h-10 rounded-full" /> */}
                <div className="ml-2 flex items-center space-x-2">
                    <p className="text-lg font-medium">{introduction.author}</p>
                    <p className="text-sm text-gray-600">{introduction.data}</p>
                </div>
            </div>
        </div>
    );
}

export default Outline;