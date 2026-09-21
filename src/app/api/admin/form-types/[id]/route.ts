import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidatePricingCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const FormTypeUpdateSchema = z.object({
  nameTr: z.string().min(1).max(200).optional(),
  coefficient: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PATCH /api/admin/form-types/[id]
 * Update a form type (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const validation = FormTypeUpdateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: validation.error.issues,
        },
      },
      { status: 400 }
    );
  }

  const data = validation.data;

  try {
    const formType = await prisma.$transaction(async (tx) => {
      const existing = await tx.formType.findUnique({
        where: { id: params.id },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      const updateData: any = {};
      if (data.nameTr !== undefined) updateData.nameTr = data.nameTr;
      if (data.coefficient !== undefined) updateData.coefficient = new Decimal(data.coefficient);
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const updated = await tx.formType.update({
        where: { id: params.id },
        data: updateData,
      });

      // Audit log
      const userId = request.headers.get('X-User-Id');
      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'UPDATE',
            entityType: 'FormType',
            entityId: updated.id,
            before: {
              nameTr: existing.nameTr,
              coefficient: existing.coefficient.toString(),
              isActive: existing.isActive,
            },
            after: {
              nameTr: updated.nameTr,
              coefficient: updated.coefficient.toString(),
              isActive: updated.isActive,
            },
          },
        });
      }

      return updated;
    });

    await invalidatePricingCache();

    return NextResponse.json({
      formType: {
        ...formType,
        coefficient: new Decimal(formType.coefficient).toFixed(2),
      },
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Form type not found' } },
        { status: 404 }
      );
    }
    throw error;
  }
}
