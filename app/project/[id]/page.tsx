import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProjectEditor from '@/components/editor/ProjectEditor';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: {
      id,
      userId: session.userId,
    },
    include: {
      pieces: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!project) {
    redirect('/dashboard');
  }

  return <ProjectEditor project={project} />;
}
