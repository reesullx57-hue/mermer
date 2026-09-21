import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidateCatalogCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const StoneBrandUpdateSchema = z.object({
  nameTr: z.string().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/stone-brands/[id]
 * Get a single stone brand by ID (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  const brand = await prisma.stoneBrand.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          collections: true,
          stones: true,
        },
      },
    },
  });

  if (!brand) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Stone brand not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ brand });
}

/**
 * PATCH /api/admin/stone-brands/[id]
 * Update a stone brand (admin only)
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

  const validation = StoneBrandUpdateSchema.safeParse(body);
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
    const brand = await prisma.$transaction(async (tx) => {
      const existing = await tx.stoneBrand.findUnique({
        where: { id: params.id },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      const updated = await tx.stoneBrand.update({
        where: { id: params.id },
        data,
      });

      // Audit log
      const user = request.headers.get('X-User-Id');
      if (user) {
        await tx.auditLog.create({
          data: {
            userId: user,
            action: 'UPDATE',
            entityType: 'StoneBrand',
            entityId: updated.id,
            before: {
              nameTr: existing.nameTr,
              isActive: existing.isActive,
            },
            after: {
              nameTr: updated.nameTr,
              isActive: updated.isActive,
            },
          },
        });
      }

      return updated;
    });

    await invalidateCatalogCache('stones');

    return NextResponse.json({ brand });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Stone brand not found' } },
        { status: 404 }
      );
    }
    throw error;
  }
}
