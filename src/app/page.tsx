"use client"
import { useEffect } from 'react';
import { useRouter } from "next/navigation";

const RootPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/smartcampus');
  }, [router]);

  return <div
   className='flex justify-center items-center'
  >正在进入智合校园...</div>;
};

export default RootPage; 