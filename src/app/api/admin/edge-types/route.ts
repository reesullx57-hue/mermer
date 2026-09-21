import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidatePricingCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const EdgeTypeCreateSchema = z.object({
  code: z.string().min(1).max(50),
  nameTr: z.string().min(1).max(200),
  coefficient: z.number().positive(),
  isActive: z.boolean().optional().default(true),
});

const EdgeTypeUpdateSchema = z.object({
  nameTr: z.string().min(1).max(200).optional(),
  coefficient: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/edge-types
 * List all edge types (admin only)
 */
export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('all') === 'true';

  const edgeTypes = await prisma.edgeType.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { code: 'asc' },
  });

  const formatted = edgeTypes.map((et) => ({
    id: et.id,
    code: et.code,
    nameTr: et.nameTr,
    coefficient: new Decimal(et.coefficient).toFixed(2),
    isActive: et.isActive,
    createdAt: et.createdAt,
    updatedAt: et.updatedAt,
  }));

  return NextResponse.json({ edgeTypes: formatted });
}

/**
 * POST /api/admin/edge-types
 * Create a new edge type (admin only)
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

  const validation = EdgeTypeCreateSchema.safeParse(body);
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
    const edgeType = await prisma.$transaction(async (tx) => {
      const existing = await tx.edgeType.findUnique({
        where: { code: data.code },
      });

      if (existing) {
        throw new Error('DUPLICATE_CODE');
      }

      const created = await tx.edgeType.create({
        data: {
          code: data.code,
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
            entityType: 'EdgeType',
            entityId: created.id,
            before: Prisma.JsonNull,
            after: {
              code: created.code,
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
        edgeType: {
          ...edgeType,
          coefficient: new Decimal(edgeType.coefficient).toFixed(2),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'DUPLICATE_CODE') {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_CODE', message: 'Edge type code already exists' } },
        { status: 409 }
      );
    }
    throw error;
  }
}
