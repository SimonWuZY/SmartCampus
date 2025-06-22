"use client"
import { useEffect } from 'react';
import { useRouter } from "next/navigation";

const RootPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/smartcampus');
  }, [router]);

  return <div>正在跳转到 SmartCampus...</div>;
};

export default RootPage; 