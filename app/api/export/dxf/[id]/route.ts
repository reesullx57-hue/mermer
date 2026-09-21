import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateDXF, pieceToDXFPoints } from '@/lib/dxf';

// Fix Bug 2: Sanitize filename to ASCII-safe for Content-Disposition
function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD') // Decompose unicode
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[ığĞİıÖöÜüŞşÇç]/g, (char) => {
      const map: Record<string, string> = {
        'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G',
        'ö': 'o', 'Ö': 'O', 'ü': 'u', 'Ü': 'U',
        'ş': 's', 'Ş': 'S', 'ç': 'c', 'Ç': 'C'
      };
      return map[char] || char;
    })
    .replace(/[^a-zA-Z0-9-_ ]/g, '') // Remove non-ASCII
    .replace(/\s+/g, '-') // Spaces to dashes
    .replace(/-+/g, '-') // Collapse multiple dashes
    .trim();
}

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
    const safeFilename = sanitizeFilename(project.name) || 'export';

    return new NextResponse(dxfContent, {
      headers: {
        'Content-Type': 'application/dxf',
        'Content-Disposition': `attachment; filename="${safeFilename}.dxf"`,
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
