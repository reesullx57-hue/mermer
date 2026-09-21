/**
 * Admin API for FormType CRUD
 * F2: /admin/catalog UI support
 * Requires ADMIN role via middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

interface FormTypeWithAudit {
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
 * GET /api/admin/form-types
 * Returns all form types (active and inactive) for admin management
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

    const formTypes = await prisma.formType.findMany({
      orderBy: { code: 'asc' },
    });

    const response: FormTypeWithAudit[] = await Promise.all(
      formTypes.map(async (ft) => {
        const lastLog = await prisma.auditLog.findFirst({
          where: {
            entityType: 'FormType',
            entityId: ft.id,
          },
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        });

        return {
          id: ft.id,
          code: ft.code,
          nameTr: ft.nameTr,
          coefficient: new Decimal(ft.coefficient).toFixed(2),
          isActive: ft.isActive,
          createdAt: ft.createdAt.toISOString(),
          updatedAt: ft.updatedAt.toISOString(),
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
    console.error('Error fetching form types:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch form types',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/form-types
 * Create new form type
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

    const existing = await prisma.formType.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'FormType with this code already exists',
          },
        },
        { status: 400 }
      );
    }

    const formType = await prisma.formType.create({
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
        entityType: 'FormType',
        entityId: formType.id,
        after: {
          code: formType.code,
          nameTr: formType.nameTr,
          coefficient: formType.coefficient.toString(),
        },
      },
    });

    return NextResponse.json(formType, { status: 201 });
  } catch (error) {
    console.error('Error creating form type:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create form type',
        },
      },
      { status: 500 }
    );
  }
}
