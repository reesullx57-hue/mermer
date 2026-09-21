import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { invalidatePricingCache } from '@/modules/pricing';

const prisma = new PrismaClient();

const ShippingZoneCreateSchema = z.object({
  city: z.string().min(1).max(100),
  district: z.string().max(100).default(''),
  fee: z.number().min(0),
  installAvailable: z.boolean().default(true),
  isActive: z.boolean().optional().default(true),
});

const ShippingZoneUpdateSchema = z.object({
  fee: z.number().min(0).optional(),
  installAvailable: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/shipping-zones
 * List all shipping zones (admin only)
 */
export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('all') === 'true';

  const zones = await prisma.shippingZone.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ city: 'asc' }, { district: 'asc' }],
  });

  const formatted = zones.map((z) => ({
    id: z.id,
    city: z.city,
    district: z.district,
    fee: new Decimal(z.fee).toFixed(2),
    installAvailable: z.installAvailable,
    isActive: z.isActive,
    createdAt: z.createdAt,
    updatedAt: z.updatedAt,
  }));

  return NextResponse.json({ zones: formatted });
}

/**
 * POST /api/admin/shipping-zones
 * Create a new shipping zone (admin only)
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

  const validation = ShippingZoneCreateSchema.safeParse(body);
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
      const existing = await tx.shippingZone.findFirst({
        where: {
          city: data.city,
          district: data.district,
        },
      });

      if (existing) {
        throw new Error('DUPLICATE_ZONE');
      }

      const created = await tx.shippingZone.create({
        data: {
          city: data.city,
          district: data.district,
          fee: new Decimal(data.fee),
          installAvailable: data.installAvailable,
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
            entityType: 'ShippingZone',
            entityId: created.id,
            before: Prisma.JsonNull,
            after: {
              city: created.city,
              district: created.district,
              fee: created.fee.toString(),
              installAvailable: created.installAvailable,
              isActive: created.isActive,
            },
          },
        });
      }

      return created;
    });

    // ADR-024: Invalidate pricing:v1:shipping + pricing:v1:all
    await invalidatePricingCache();

    return NextResponse.json(
      {
        zone: {
          ...zone,
          fee: new Decimal(zone.fee).toFixed(2),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'DUPLICATE_ZONE') {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_ZONE', message: 'Shipping zone for this city/district already exists' } },
        { status: 409 }
      );
    }
    throw error;
  }
}
