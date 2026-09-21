import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { pieces } = await request.json();

    const project = await prisma.project.findFirst({
      where: { id, userId: session.userId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete existing pieces
    await prisma.piece.deleteMany({
      where: { projectId: id },
    });

    // Create new pieces
    if (pieces && pieces.length > 0) {
      await prisma.piece.createMany({
        data: pieces.map((piece: any, index: number) => ({
          id: piece.id,
          projectId: id,
          name: piece.name,
          type: piece.type,
          geometry: JSON.stringify(piece.geometry),
          x: piece.x,
          y: piece.y,
          rotation: piece.rotation,
          flipped: piece.flipped,
          width: piece.width,
          height: piece.height,
          orderIndex: index,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save pieces error:', error);
    return NextResponse.json(
      { error: 'Failed to save pieces' },
      { status: 500 }
    );
  }
}
