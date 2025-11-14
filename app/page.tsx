'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/chat');
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-[var(--text-secondary)]">
        채팅으로 이동 중...
      </div>
    </div>
  );
}
