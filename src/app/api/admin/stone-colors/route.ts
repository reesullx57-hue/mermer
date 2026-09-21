import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import Decimal from 'decimal.js';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidateCatalogCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const StoneColorSchema = z.object({
  stoneId: z.string().cuid(),
  code: z.string().min(1).max(50),
  nameTr: z.string().min(1).max(200),
  m2Price: z.number().positive(),
  wastePercent: z.number().min(0).max(1).nullable().optional(),
  isActive: z.boolean().optional().default(true),
  textureUrl: z.string().url().nullable().optional(),
});

/**
 * GET /api/admin/stone-colors
 * List all stone colors (admin only)
 */
export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('all') === 'true';
  const stoneId = searchParams.get('stoneId');

  const colors = await prisma.stoneColor.findMany({
    where: {
      ...(includeInactive ? {} : { isActive: true }),
      ...(stoneId ? { stoneId } : {}),
    },
    orderBy: [{ stoneId: 'asc' }, { code: 'asc' }],
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

  const formatted = colors.map((color) => ({
    id: color.id,
    stoneId: color.stoneId,
    code: color.code,
    nameTr: color.nameTr,
    m2Price: new Decimal(color.m2Price).toFixed(2),
    wastePercent: color.wastePercent ? new Decimal(color.wastePercent).toFixed(4) : null,
    isActive: color.isActive,
    textureUrl: color.textureUrl,
    createdAt: color.createdAt,
    updatedAt: color.updatedAt,
    stone: color.stone,
  }));

  return NextResponse.json({ colors: formatted });
}

/**
 * POST /api/admin/stone-colors
 * Create a new stone color (admin only)
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

  const validation = StoneColorSchema.safeParse(body);
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
      const stone = await tx.stone.findUnique({
        where: { id: data.stoneId },
      });

      if (!stone) {
        throw new Error('STONE_NOT_FOUND');
      }

      const existing = await tx.stoneColor.findFirst({
        where: {
          stoneId: data.stoneId,
          code: data.code,
        },
      });

      if (existing) {
        throw new Error('DUPLICATE_CODE');
      }

      const created = await tx.stoneColor.create({
        data: {
          stoneId: data.stoneId,
          code: data.code,
          nameTr: data.nameTr,
          m2Price: new Decimal(data.m2Price),
          wastePercent: data.wastePercent ? new Decimal(data.wastePercent) : null,
          isActive: data.isActive,
          textureUrl: data.textureUrl ?? null,
        },
      });

      // Audit log
      const user = request.headers.get('X-User-Id');
      if (user) {
        await tx.auditLog.create({
          data: {
            userId: user,
            action: 'CREATE',
            entityType: 'StoneColor',
            entityId: created.id,
            before: Prisma.JsonNull,
            after: {
              stoneId: created.stoneId,
              code: created.code,
              nameTr: created.nameTr,
              m2Price: created.m2Price.toString(),
              wastePercent: created.wastePercent?.toString() ?? null,
              isActive: created.isActive,
              textureUrl: created.textureUrl,
            },
          },
        });
      }

      return created;
    });

    await invalidateCatalogCache('stones');

    return NextResponse.json(
      {
        color: {
          ...color,
          m2Price: new Decimal(color.m2Price).toFixed(2),
          wastePercent: color.wastePercent ? new Decimal(color.wastePercent).toFixed(4) : null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'STONE_NOT_FOUND') {
      return NextResponse.json(
        { error: { code: 'STONE_NOT_FOUND', message: 'Stone not found' } },
        { status: 404 }
      );
    }
    if (error.message === 'DUPLICATE_CODE') {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_CODE', message: 'Color code already exists for this stone' } },
        { status: 409 }
      );
    }
    throw error;
  }
}
