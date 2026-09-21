import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidateCatalogCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const StoneSchema = z.object({
  brandId: z.string().cuid(),
  collectionId: z.string().cuid().nullable().optional(),
  code: z.string().min(1).max(50),
  nameTr: z.string().min(1).max(200),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/admin/stones
 * List all stones (admin only)
 */
export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('all') === 'true';
  const brandId = searchParams.get('brandId');
  const collectionId = searchParams.get('collectionId');

  const stones = await prisma.stone.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(brandId ? { brandId } : {}),
      ...(collectionId ? { collectionId } : {}),
    },
    orderBy: [{ brandId: 'asc' }, { code: 'asc' }],
    include: {
      brand: {
        select: {
          code: true,
          nameTr: true,
        },
      },
      collection: {
        select: {
          code: true,
          nameTr: true,
        },
      },
      _count: {
        select: {
          colors: true,
        },
      },
    },
  });

  return NextResponse.json({ stones });
}

/**
 * POST /api/admin/stones
 * Create a new stone (admin only)
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

  const validation = StoneSchema.safeParse(body);
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
    const stone = await prisma.$transaction(async (tx) => {
      const brand = await tx.stoneBrand.findUnique({
        where: { id: data.brandId },
      });

      if (!brand) {
        throw new Error('BRAND_NOT_FOUND');
      }

      if (data.collectionId) {
        const collection = await tx.stoneCollection.findUnique({
          where: { id: data.collectionId },
        });

        if (!collection) {
          throw new Error('COLLECTION_NOT_FOUND');
        }
      }

      const existing = await tx.stone.findUnique({
        where: { code: data.code },
      });

      if (existing) {
        throw new Error('DUPLICATE_CODE');
      }

      const created = await tx.stone.create({
        data: {
          brandId: data.brandId,
          collectionId: data.collectionId,
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
            entityType: 'Stone',
            entityId: created.id,
            before: Prisma.JsonNull,
            after: {
              brandId: created.brandId,
              collectionId: created.collectionId,
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

    return NextResponse.json({ stone }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'BRAND_NOT_FOUND') {
      return NextResponse.json(
        { error: { code: 'BRAND_NOT_FOUND', message: 'Stone brand not found' } },
        { status: 404 }
      );
    }
    if (error.message === 'COLLECTION_NOT_FOUND') {
      return NextResponse.json(
        { error: { code: 'COLLECTION_NOT_FOUND', message: 'Stone collection not found' } },
        { status: 404 }
      );
    }
    if (error.message === 'DUPLICATE_CODE') {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_CODE', message: 'Stone code already exists' } },
        { status: 409 }
      );
    }
    throw error;
  }
}
