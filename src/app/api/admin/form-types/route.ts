import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidatePricingCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const FormTypeCreateSchema = z.object({
  code: z.string().min(1).max(50),
  nameTr: z.string().min(1).max(200),
  coefficient: z.number().positive(),
  isActive: z.boolean().optional().default(true),
});

const FormTypeUpdateSchema = z.object({
  nameTr: z.string().min(1).max(200).optional(),
  coefficient: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/form-types
 * List all form types (admin only)
 */
export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('all') === 'true';

  const formTypes = await prisma.formType.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { code: 'asc' },
  });

  const formatted = formTypes.map((ft) => ({
    id: ft.id,
    code: ft.code,
    nameTr: ft.nameTr,
    coefficient: new Decimal(ft.coefficient).toFixed(2),
    isActive: ft.isActive,
    createdAt: ft.createdAt,
    updatedAt: ft.updatedAt,
  }));

  return NextResponse.json({ formTypes: formatted });
}

/**
 * POST /api/admin/form-types
 * Create a new form type (admin only)
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

  const validation = FormTypeCreateSchema.safeParse(body);
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
        where: { code: data.code },
      });

      if (existing) {
        throw new Error('DUPLICATE_CODE');
      }

      const created = await tx.formType.create({
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
            entityType: 'FormType',
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
        formType: {
          ...formType,
          coefficient: new Decimal(formType.coefficient).toFixed(2),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'DUPLICATE_CODE') {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_CODE', message: 'Form type code already exists' } },
        { status: 409 }
      );
    }
    throw error;
  }
}
