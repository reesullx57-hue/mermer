import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ApprovalClient from '@/components/ApprovalClient';

export default async function ApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const approval = await prisma.approval.findUnique({
    where: { token },
    include: {
      project: {
        include: {
          pieces: true,
        },
      },
    },
  });

  if (!approval) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Bağlantı Bulunamadı</h1>
          <p className="text-gray-400">Bu onay bağlantısı geçersiz veya süresi dolmuş.</p>
        </div>
      </div>
    );
  }

  return <ApprovalClient approval={approval} />;
}
