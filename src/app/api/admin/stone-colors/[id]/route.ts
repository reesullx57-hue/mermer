import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import Decimal from 'decimal.js';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidateCatalogCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const StoneColorUpdateSchema = z.object({
  nameTr: z.string().min(1).max(200).optional(),
  m2Price: z.number().positive().optional(),
  wastePercent: z.number().min(0).max(1).nullable().optional(),
  isActive: z.boolean().optional(),
  textureUrl: z.string().url().nullable().optional(),
});

/**
 * GET /api/admin/stone-colors/[id]
 * Get a single stone color by ID (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  const color = await prisma.stoneColor.findUnique({
    where: { id: params.id },
    include: {
      stone: {
        select: {
          code: true,
          nameTr: true,
          brand: {
            select: {
              code: true,
              nameTr: true,
            },
          },
        },
      },
    },
  });

  if (!color) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Stone color not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    color: {
      ...color,
      m2Price: new Decimal(color.m2Price).toFixed(2),
      wastePercent: color.wastePercent ? new Decimal(color.wastePercent).toFixed(4) : null,
    },
  });
}

/**
 * PATCH /api/admin/stone-colors/[id]
 * Update a stone color (admin only)
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

  const validation = StoneColorUpdateSchema.safeParse(body);
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
    const color = await prisma.$transaction(async (tx) => {
      const existing = await tx.stoneColor.findUnique({
        where: { id: params.id },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      const updateData: any = {};
      if (data.nameTr !== undefined) updateData.nameTr = data.nameTr;
      if (data.m2Price !== undefined) updateData.m2Price = new Decimal(data.m2Price);
      if (data.wastePercent !== undefined) {
        updateData.wastePercent = data.wastePercent ? new Decimal(data.wastePercent) : null;
      }
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.textureUrl !== undefined) updateData.textureUrl = data.textureUrl;

      const updated = await tx.stoneColor.update({
        where: { id: params.id },
        data: updateData,
      });

      // Audit log
      const user = request.headers.get('X-User-Id');
      if (user) {
        await tx.auditLog.create({
          data: {
            userId: user,
            action: 'UPDATE',
            entityType: 'StoneColor',
            entityId: updated.id,
            before: {
              nameTr: existing.nameTr,
              m2Price: existing.m2Price.toString(),
              wastePercent: existing.wastePercent?.toString() ?? null,
              isActive: existing.isActive,
              textureUrl: existing.textureUrl,
            },
            after: {
              nameTr: updated.nameTr,
              m2Price: updated.m2Price.toString(),
              wastePercent: updated.wastePercent?.toString() ?? null,
              isActive: updated.isActive,
              textureUrl: updated.textureUrl,
            },
          },
        });
      }

      return updated;
    });

    await invalidateCatalogCache('stones');

    return NextResponse.json({
      color: {
        ...color,
        m2Price: new Decimal(color.m2Price).toFixed(2),
        wastePercent: color.wastePercent ? new Decimal(color.wastePercent).toFixed(4) : null,
      },
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Stone color not found' } },
        { status: 404 }
      );
    }
    throw error;
  }
}
