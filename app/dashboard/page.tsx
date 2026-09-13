import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/DashboardClient';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const projects = await prisma.project.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      pieces: true,
    },
  });

  // Convert dates to strings for client component
  const serializedProjects = projects.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    pieces: p.pieces.map(piece => ({
      ...piece,
      createdAt: piece.createdAt.toISOString(),
      updatedAt: piece.updatedAt.toISOString(),
    })),
  }));

  return <DashboardClient projects={serializedProjects} user={session} />;
}
