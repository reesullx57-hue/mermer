/**
 * GET /api/admin/pricerules/[id] - Get price rule by ID
 * PATCH /api/admin/pricerules/[id] - Update price rule
 * 
 * ADMIN only - F2 Gate 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidatePricingCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const UpdatePriceRuleSchema = z.object({
  nameTr: z.string().min(1).optional(),
  value: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin authorization
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  try {
    const rule = await prisma.priceRule.findUnique({
      where: { id: params.id },
    });

    if (!rule) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Price rule not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: rule.id,
      code: rule.code,
      nameTr: rule.nameTr,
      value: new Decimal(rule.value).toFixed(2),
      unit: rule.unit,
      isActive: rule.isActive,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching price rule:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch price rule',
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin authorization
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validated = UpdatePriceRuleSchema.parse(body);

    // Fetch current rule for audit log
    const currentRule = await prisma.priceRule.findUnique({
      where: { id: params.id },
    });

    if (!currentRule) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Price rule not found',
          },
        },
        { status: 404 }
      );
    }

    // Update rule
    const updateData: any = {};
    if (validated.nameTr !== undefined) updateData.nameTr = validated.nameTr;
    if (validated.value !== undefined) updateData.value = new Decimal(validated.value);
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

    const updatedRule = await prisma.priceRule.update({
      where: { id: params.id },
      data: updateData,
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user!.id,
        action: 'UPDATE',
        entityType: 'PriceRule',
        entityId: updatedRule.id,
        before: {
          code: currentRule.code,
          nameTr: currentRule.nameTr,
          value: currentRule.value.toString(),
          unit: currentRule.unit,
          isActive: currentRule.isActive,
        },
        after: {
          code: updatedRule.code,
          nameTr: updatedRule.nameTr,
          value: updatedRule.value.toString(),
          unit: updatedRule.unit,
          isActive: updatedRule.isActive,
        },
      },
    });

    // Invalidate pricing cache
    await invalidatePricingCache();

    return NextResponse.json({
      id: updatedRule.id,
      code: updatedRule.code,
      nameTr: updatedRule.nameTr,
      value: new Decimal(updatedRule.value).toFixed(2),
      unit: updatedRule.unit,
      isActive: updatedRule.isActive,
      createdAt: updatedRule.createdAt.toISOString(),
      updatedAt: updatedRule.updatedAt.toISOString(),
    });
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

    console.error('Error updating price rule:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update price rule',
        },
      },
      { status: 500 }
    );
  }
}
