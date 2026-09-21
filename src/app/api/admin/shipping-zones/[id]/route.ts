import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidatePricingCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const ShippingZoneUpdateSchema = z.object({
  fee: z.number().min(0).optional(),
  installAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/shipping-zones/[id]
 * Get a single shipping zone by ID (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  const zone = await prisma.shippingZone.findUnique({
    where: { id: params.id },
  });

  if (!zone) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Shipping zone not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    zone: {
      ...zone,
      fee: new Decimal(zone.fee).toFixed(2),
    },
  });
}

/**
 * PATCH /api/admin/shipping-zones/[id]
 * Update a shipping zone (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const validation = ShippingZoneUpdateSchema.safeParse(body);
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
    const zone = await prisma.$transaction(async (tx) => {
      const existing = await tx.shippingZone.findUnique({
        where: { id: params.id },
      });

      if (!existing) {
        throw new Error('NOT_FOUND');
      }

      const updateData: any = {};
      if (data.fee !== undefined) updateData.fee = new Decimal(data.fee);
      if (data.installAvailable !== undefined) updateData.installAvailable = data.installAvailable;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      const updated = await tx.shippingZone.update({
        where: { id: params.id },
        data: updateData,
      });

      // Audit log
      const userId = request.headers.get('X-User-Id');
      if (userId) {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'UPDATE',
            entityType: 'ShippingZone',
            entityId: updated.id,
            before: {
              fee: existing.fee.toString(),
              installAvailable: existing.installAvailable,
              isActive: existing.isActive,
            },
            after: {
              fee: updated.fee.toString(),
              installAvailable: updated.installAvailable,
              isActive: updated.isActive,
            },
          },
        });
      }

      return updated;
    });

    // ADR-024: Invalidate pricing:v1:shipping + pricing:v1:all
    await invalidatePricingCache();

    return NextResponse.json({
      zone: {
        ...zone,
        fee: new Decimal(zone.fee).toFixed(2),
      },
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Shipping zone not found' } },
        { status: 404 }
      );
    }
    throw error;
  }
}
