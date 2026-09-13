import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateDXF, pieceToDXFPoints } from '@/lib/dxf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: { id, userId: session.userId },
      include: { pieces: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.pieces || project.pieces.length === 0) {
      return NextResponse.json({ error: 'No pieces to export' }, { status: 400 });
    }

    // Convert pieces to DXF format
    const dxfPieces = project.pieces.map((piece) => ({
      name: piece.name,
      points: pieceToDXFPoints(
        piece.geometry,
        piece.x,
        piece.y,
        piece.rotation,
        piece.flipped
      ),
      closed: true,
    }));

    const dxfContent = generateDXF(dxfPieces);

    return new NextResponse(dxfContent, {
      headers: {
        'Content-Type': 'application/dxf',
        'Content-Disposition': `attachment; filename="${project.name}.dxf"`,
      },
    });
  } catch (error) {
    console.error('DXF export error:', error);
    return NextResponse.json(
      { error: 'Failed to export DXF' },
      { status: 500 }
    );
  }
}
