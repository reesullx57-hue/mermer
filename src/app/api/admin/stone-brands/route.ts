import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidateCatalogCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const StoneBrandSchema = z.object({
  code: z.string().min(1).max(50),
  nameTr: z.string().min(1).max(200),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/admin/stone-brands
 * List all stone brands (admin only)
 */
export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('all') === 'true';

  const brands = await prisma.stoneBrand.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { code: 'asc' },
    select: {
      id: true,
      code: true,
      nameTr: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          collections: true,
          stones: true,
        },
      },
    },
  });

  return NextResponse.json({ brands });
}

/**
 * POST /api/admin/stone-brands
 * Create a new stone brand (admin only)
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

  const validation = StoneBrandSchema.safeParse(body);
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
        where: { code: data.code },
      });

      if (existing) {
        throw new Error('DUPLICATE_CODE');
      }

      const created = await tx.stoneBrand.create({
        data: {
          code: data.code,
          nameTr: data.nameTr,
          isActive: data.isActive,
        },
      });

      // Audit log
      const user = request.headers.get('X-User-Id');
      if (user) {
        await tx.auditLog.create({
          data: {
            userId: user,
            action: 'CREATE',
            entityType: 'StoneBrand',
            entityId: created.id,
            before: Prisma.JsonNull,
            after: {
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

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'DUPLICATE_CODE') {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_CODE', message: 'Brand code already exists' } },
        { status: 409 }
      );
    }
    throw error;
  }
}
