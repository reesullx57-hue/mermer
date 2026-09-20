import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidatePricingCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const ThicknessCreateSchema = z.object({
  cm: z.number().positive().int(),
  nameTr: z.string().min(1).max(200),
  coefficient: z.number().positive(),
  isActive: z.boolean().optional().default(true),
});

const ThicknessUpdateSchema = z.object({
  nameTr: z.string().min(1).max(200).optional(),
  coefficient: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/thicknesses
 * List all thicknesses (admin only)
 */
export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('all') === 'true';

  const thicknesses = await prisma.thickness.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { cm: 'asc' },
  });

  const formatted = thicknesses.map((t) => ({
    id: t.id,
    cm: t.cm,
    code: String(t.cm),
    nameTr: t.nameTr,
    coefficient: new Decimal(t.coefficient).toFixed(2),
    isActive: t.isActive,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  return NextResponse.json({ thicknesses: formatted });
}

/**
 * POST /api/admin/thicknesses
 * Create a new thickness (admin only)
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

  const validation = ThicknessCreateSchema.safeParse(body);
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
      const existing = await tx.thickness.findFirst({
        where: { cm: data.cm },
      });

      if (existing) {
        throw new Error('DUPLICATE_CM');
      }

      const created = await tx.thickness.create({
        data: {
          cm: data.cm,
          nameTr: data.nameTr,
          coefficient: new Decimal(data.coefficient),
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
            entityType: 'Thickness',
            entityId: created.id,
            before: Prisma.JsonNull,
            after: {
              cm: created.cm,
              nameTr: created.nameTr,
              coefficient: created.coefficient.toString(),
              isActive: created.isActive,
            },
          },
        });
      }

      return created;
    });

    await invalidatePricingCache();

    return NextResponse.json(
      {
        thickness: {
          ...thickness,
          code: String(thickness.cm),
          coefficient: new Decimal(thickness.coefficient).toFixed(2),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'DUPLICATE_CM') {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_CM', message: 'Thickness with this cm value already exists' } },
        { status: 409 }
      );
    }
    throw error;
  }
}
