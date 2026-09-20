/**
 * Admin API for EdgeType single-item operations
 * F2: /admin/catalog UI support
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * PATCH /api/admin/edge-types/[id]
 * Update edge type coefficient and nameTr
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { nameTr, coefficient } = body;

    const existing = await prisma.edgeType.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'EdgeType not found' } },
        { status: 404 }
      );
    }

    const updated = await prisma.edgeType.update({
      where: { id },
      data: {
        ...(nameTr !== undefined && { nameTr }),
        ...(coefficient !== undefined && {
          coefficient: new Decimal(coefficient).toFixed(4),
        }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATE',
        entityType: 'EdgeType',
        entityId: id,
        before: {
          nameTr: existing.nameTr,
          coefficient: existing.coefficient.toString(),
        },
        after: {
          nameTr: updated.nameTr,
          coefficient: updated.coefficient.toString(),
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating edge type:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update edge type',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/edge-types/[id]
 * Deactivate edge type (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id } = params;

    const existing = await prisma.edgeType.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'EdgeType not found' } },
        { status: 404 }
      );
    }

    const updated = await prisma.edgeType.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'DEACTIVATE',
        entityType: 'EdgeType',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating edge type:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to deactivate edge type',
        },
      },
      { status: 500 }
    );
  }
}
