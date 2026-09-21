import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidatePricingCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const TaxConfigUpdateSchema = z.object({
  vatRate: z.number().min(0).max(1),
});

/**
 * GET /api/admin/tax-configs
 * List all tax configs (admin only)
 */
export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  const configs = await prisma.taxConfig.findMany({
    orderBy: { code: 'asc' },
  });

  const formatted = configs.map((c) => ({
    id: c.id,
    code: c.code,
    vatRate: new Decimal(c.vatRate).toFixed(4),
    isActive: c.isActive,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  return NextResponse.json({ configs: formatted });
}

/**
 * PATCH /api/admin/tax-configs/:code
 * Update VAT rate for a tax config (admin only)
 * Note: Uses code in path for easier access (e.g., VAT_TR)
 */
export async function PATCH(request: NextRequest) {
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

  const validation = TaxConfigUpdateSchema.safeParse(body);
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
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || 'VAT_TR';

  try {
    const config = await prisma.$transaction(async (tx) => {
      const existing = await tx.taxConfig.findUnique({
        where: { code },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      const updated = await tx.taxConfig.update({
        where: { code },
        data: {
          vatRate: new Decimal(data.vatRate),
        },
      });

      // Audit log
      const userId = request.headers.get('X-User-Id');
      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'UPDATE',
            entityType: 'TaxConfig',
            entityId: updated.id,
            before: {
              code: existing.code,
              vatRate: existing.vatRate.toString(),
            },
            after: {
              code: updated.code,
              vatRate: updated.vatRate.toString(),
            },
          },
        });
      }

      return updated;
    });

    // ADR-025: Invalidate pricing:v1:tax + pricing:v1:all
    await invalidatePricingCache();

    return NextResponse.json({
      config: {
        ...config,
        vatRate: new Decimal(config.vatRate).toFixed(4),
      },
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Tax config not found' } },
        { status: 404 }
      );
    }
    throw error;
  }
}
