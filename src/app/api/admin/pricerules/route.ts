/**
 * GET /api/admin/pricerules - List price rules
 * POST /api/admin/pricerules - Create price rule
 * 
 * ADMIN only - F2 Gate 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidatePricingCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const CreatePriceRuleSchema = z.object({
  code: z.string().min(1),
  nameTr: z.string().min(1),
  value: z.number().positive(),
  unit: z.enum(['TRY', 'TRY_PER_METER', 'PERCENT', 'NUMBER']),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  // Check admin authorization
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    const rules = await prisma.priceRule.findMany({
      where: showAll ? {} : { isActive: true },
      orderBy: { code: 'asc' },
    });

    const response = rules.map((r) => ({
      id: r.id,
      code: r.code,
      nameTr: r.nameTr,
      value: new Decimal(r.value).toFixed(2),
      unit: r.unit,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching price rules:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch price rules',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check admin authorization
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validated = CreatePriceRuleSchema.parse(body);

    // Check if code already exists
    const existing = await prisma.priceRule.findUnique({
      where: { code: validated.code },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: `Price rule with code '${validated.code}' already exists`,
          },
        },
        { status: 409 }
      );
    }

    const newRule = await prisma.priceRule.create({
      data: {
        code: validated.code,
        nameTr: validated.nameTr,
        value: new Decimal(validated.value),
        unit: validated.unit,
        isActive: validated.isActive,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user!.id,
        action: 'CREATE',
        entityType: 'PriceRule',
        entityId: newRule.id,
        before: Prisma.JsonNull,
        after: {
          code: newRule.code,
          nameTr: newRule.nameTr,
          value: newRule.value.toString(),
          unit: newRule.unit,
          isActive: newRule.isActive,
        },
      },
    });

    // Invalidate pricing cache
    await invalidatePricingCache();

    return NextResponse.json(
      {
        id: newRule.id,
        code: newRule.code,
        nameTr: newRule.nameTr,
        value: new Decimal(newRule.value).toFixed(2),
        unit: newRule.unit,
        isActive: newRule.isActive,
        createdAt: newRule.createdAt.toISOString(),
        updatedAt: newRule.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid price rule data',
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error creating price rule:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create price rule',
        },
      },
      { status: 500 }
    );
  }
}
