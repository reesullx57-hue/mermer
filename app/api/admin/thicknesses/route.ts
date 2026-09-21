/**
 * Admin API for Thickness CRUD
 * F2: /admin/catalog UI support
 * Requires ADMIN role via middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

interface ThicknessWithAudit {
  id: string;
  cm: number;
  nameTr: string;
  coefficient: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUpdater?: {
    email: string;
    timestamp: string;
  } | null;
}

/**
 * GET /api/admin/thicknesses
 * Returns all thicknesses (active and inactive) for admin management
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const thicknesses = await prisma.thickness.findMany({
      orderBy: { cm: 'asc' },
    });

    const response: ThicknessWithAudit[] = await Promise.all(
      thicknesses.map(async (t) => {
        const lastLog = await prisma.auditLog.findFirst({
          where: {
            entityType: 'Thickness',
            entityId: t.id,
          },
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        });

        return {
          id: t.id,
          cm: t.cm,
          nameTr: t.nameTr,
          coefficient: new Decimal(t.coefficient).toFixed(2),
          isActive: t.isActive,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          lastUpdater: lastLog
            ? {
                email: lastLog.user?.email || 'Unknown',
                timestamp: lastLog.createdAt.toISOString(),
              }
            : null,
        };
      })
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching thicknesses:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch thicknesses',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/thicknesses
 * Create new thickness
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { cm, nameTr, coefficient } = body;

    if (!cm || !nameTr || coefficient === undefined) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: cm, nameTr, coefficient',
          },
        },
        { status: 400 }
      );
    }

    const existing = await prisma.thickness.findUnique({
      where: { cm: parseInt(cm) },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Thickness with this cm value already exists',
          },
        },
        { status: 400 }
      );
    }

    const thickness = await prisma.thickness.create({
      data: {
        cm: parseInt(cm),
        nameTr,
        coefficient: new Decimal(coefficient).toFixed(4),
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATE',
        entityType: 'Thickness',
        entityId: thickness.id,
        after: {
          cm: thickness.cm,
          nameTr: thickness.nameTr,
          coefficient: thickness.coefficient.toString(),
        },
      },
    });

    return NextResponse.json(thickness, { status: 201 });
  } catch (error) {
    console.error('Error creating thickness:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create thickness',
        },
      },
      { status: 500 }
    );
  }
}
