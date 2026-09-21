import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidateCatalogCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const StoneCollectionSchema = z.object({
  brandId: z.string().cuid(),
  code: z.string().min(1).max(50),
  nameTr: z.string().min(1).max(200),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/admin/stone-collections
 * List all stone collections (admin only)
 */
export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('all') === 'true';
  const brandId = searchParams.get('brandId');

  const collections = await prisma.stoneCollection.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(brandId ? { brandId } : {}),
    },
    orderBy: [{ brandId: 'asc' }, { code: 'asc' }],
    include: {
      brand: {
        select: {
          code: true,
          nameTr: true,
        },
      },
      _count: {
        select: {
          stones: true,
        },
      },
    },
  });

  return NextResponse.json({ collections });
}

/**
 * POST /api/admin/stone-collections
 * Create a new stone collection (admin only)
 */
export async function POST(request: NextRequest) {
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

  const validation = StoneCollectionSchema.safeParse(body);
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
    const collection = await prisma.$transaction(async (tx) => {
      const brand = await tx.stoneBrand.findUnique({
        where: { id: data.brandId },
      });

      if (!brand) {
        throw new Error('BRAND_NOT_FOUND');
      }

      const existing = await tx.stoneCollection.findFirst({
        where: {
          brandId: data.brandId,
          code: data.code,
        },
      });

      if (existing) {
        throw new Error('DUPLICATE_CODE');
      }

      const created = await tx.stoneCollection.create({
        data: {
          brandId: data.brandId,
          code: data.code,
          nameTr: data.nameTr,
          isActive: data.isActive,
        },
      });

      // Audit log
      const userId = request.headers.get('X-User-Id');
      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'CREATE',
            entityType: 'StoneCollection',
            entityId: created.id,
            before: Prisma.JsonNull,
            after: {
              brandId: created.brandId,
              code: created.code,
              nameTr: created.nameTr,
              isActive: created.isActive,
            },
          },
        });
      }

      return created;
    });

    await invalidateCatalogCache('stones');

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'BRAND_NOT_FOUND') {
      return NextResponse.json(
        { error: { code: 'BRAND_NOT_FOUND', message: 'Stone brand not found' } },
        { status: 404 }
      );
    }
    if (error.message === 'DUPLICATE_CODE') {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_CODE', message: 'Collection code already exists for this brand' } },
        { status: 409 }
      );
    }
    throw error;
  }
}
