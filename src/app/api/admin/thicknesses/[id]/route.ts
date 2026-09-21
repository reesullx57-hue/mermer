import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidatePricingCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const ThicknessUpdateSchema = z.object({
  nameTr: z.string().min(1).max(200).optional(),
  coefficient: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/thicknesses/[id]
 * Get a single thickness by ID (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  const thickness = await prisma.thickness.findUnique({
    where: { id: params.id },
  });

  if (!thickness) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Thickness not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    thickness: {
      ...thickness,
      code: String(thickness.cm),
      coefficient: new Decimal(thickness.coefficient).toFixed(2),
    },
  });
}

/**
 * PATCH /api/admin/thicknesses/[id]
 * Update a thickness (admin only)
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

  const validation = ThicknessUpdateSchema.safeParse(body);
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
    const thickness = await prisma.$transaction(async (tx) => {
      const existing = await tx.thickness.findUnique({
        where: { id: params.id },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      const updateData: any = {};
      if (data.nameTr !== undefined) updateData.nameTr = data.nameTr;
      if (data.coefficient !== undefined) updateData.coefficient = new Decimal(data.coefficient);
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const updated = await tx.thickness.update({
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
            entityType: 'Thickness',
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
      thickness: {
        ...thickness,
        code: String(thickness.cm),
        coefficient: new Decimal(thickness.coefficient).toFixed(2),
      },
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Thickness not found' } },
        { status: 404 }
      );
    }
    throw error;
  }
}
