'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    const loginDemo = async () => {
      try {
        const res = await fetch('/api/auth/demo', {
          method: 'POST',
        });

        if (res.ok) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
    };

    loginDemo();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl animate-pulse"></div>
        <p className="text-white text-lg">Demo hesabı açılıyor...</p>
      </div>
    </div>
  );
}
