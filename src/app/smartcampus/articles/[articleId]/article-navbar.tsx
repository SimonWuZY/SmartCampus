"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical } from 'lucide-react';

const Navbar = () => {
    const router = useRouter();

    const handleBack = () => {
        router.push('/smartcampus');
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                url: window.location.href,
            }).catch(console.error);
        } else {
            alert('此浏览器不支持分享功能');
        }
    };

    return (
        <div className="flex justify-between items-center p-4 border-b">
            <button onClick={handleBack} className="flex items-center">
                <ArrowLeft size={24} />
            </button>
            <button onClick={handleShare} className="flex items-center">
                <MoreVertical size={24} />
            </button>
        </div>
    );
};

export default Navbar;