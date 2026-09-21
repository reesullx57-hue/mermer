/**
 * Admin API for EdgeType CRUD
 * F2: /admin/catalog UI support
 * Requires ADMIN role via middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

interface EdgeTypeWithAudit {
  id: string;
  code: string;
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
 * GET /api/admin/edge-types
 * Returns all edge types (active and inactive) for admin management
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

    const edgeTypes = await prisma.edgeType.findMany({
      orderBy: { code: 'asc' },
    });

    const response: EdgeTypeWithAudit[] = await Promise.all(
      edgeTypes.map(async (et) => {
        const lastLog = await prisma.auditLog.findFirst({
          where: {
            entityType: 'EdgeType',
            entityId: et.id,
          },
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        });

        return {
          id: et.id,
          code: et.code,
          nameTr: et.nameTr,
          coefficient: new Decimal(et.coefficient).toFixed(2),
          isActive: et.isActive,
          createdAt: et.createdAt.toISOString(),
          updatedAt: et.updatedAt.toISOString(),
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
    console.error('Error fetching edge types:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch edge types',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/edge-types
 * Create new edge type
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
    const { code, nameTr, coefficient } = body;

    if (!code || !nameTr || coefficient === undefined) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: code, nameTr, coefficient',
          },
        },
        { status: 400 }
      );
    }

    const existing = await prisma.edgeType.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'EdgeType with this code already exists',
          },
        },
        { status: 400 }
      );
    }

    const edgeType = await prisma.edgeType.create({
      data: {
        code,
        nameTr,
        coefficient: new Decimal(coefficient).toFixed(4),
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'CREATE',
        entityType: 'EdgeType',
        entityId: edgeType.id,
        after: {
          code: edgeType.code,
          nameTr: edgeType.nameTr,
          coefficient: edgeType.coefficient.toString(),
        },
      },
    });

    return NextResponse.json(edgeType, { status: 201 });
  } catch (error) {
    console.error('Error creating edge type:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create edge type',
        },
      },
      { status: 500 }
    );
  }
}
