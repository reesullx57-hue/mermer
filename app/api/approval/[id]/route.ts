import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

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

    const project = await prisma.project.findFirst({
      where: { id, userId: session.userId },
      include: { pieces: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if approval already exists
    let approval = await prisma.approval.findFirst({
      where: { projectId: id },
    });

    if (!approval) {
      // Create approval token
      const token = crypto.randomBytes(16).toString('hex');

      approval = await prisma.approval.create({
        data: {
          projectId: id,
          token,
          snapshotData: JSON.stringify({
            project: {
              name: project.name,
              slabWidth: project.slabWidth,
              slabHeight: project.slabHeight,
            },
            pieces: project.pieces,
          }),
        },
      });
    }

    return NextResponse.json(approval);
  } catch (error) {
    console.error('Create approval error:', error);
    return NextResponse.json(
      { error: 'Failed to create approval link' },
      { status: 500 }
    );
  }
}
