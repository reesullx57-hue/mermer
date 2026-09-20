/**
 * Admin API for FormType single-item operations
 * F2: /admin/catalog UI support
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * PATCH /api/admin/form-types/[id]
 * Update form type coefficient and nameTr
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

    const existing = await prisma.formType.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'FormType not found' } },
        { status: 404 }
      );
    }

    const updated = await prisma.formType.update({
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
        entityType: 'FormType',
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
    console.error('Error updating form type:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update form type',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/form-types/[id]
 * Deactivate form type (soft delete)
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

    const existing = await prisma.formType.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'FormType not found' } },
        { status: 404 }
      );
    }

    const updated = await prisma.formType.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'DEACTIVATE',
        entityType: 'FormType',
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating form type:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to deactivate form type',
        },
      },
      { status: 500 }
    );
  }
}
