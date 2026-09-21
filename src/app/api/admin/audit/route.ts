import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getCurrentUser, requireAdmin } from '@/lib/auth';

const prisma = new PrismaClient();

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  // Auth
  const user = getCurrentUser(request);
  const authError = requireAdmin(user);
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const entityType = searchParams.get('entityType') || undefined;
    const entityId = searchParams.get('entityId') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(
      parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10),
      MAX_PAGE_SIZE
    );

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = new Date(from);
      }
      if (to) {
        where.createdAt.lte = new Date(to);
      }
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Get paginated items
    const items = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Fetch ImportJob metadata for IMPORT actions
    const importJobIds = items
      .filter(item => item.action === 'IMPORT' && item.entityId)
      .map(item => item.entityId!);

    const importJobs = await prisma.importJob.findMany({
      where: { id: { in: importJobIds } },
      select: {
        id: true,
        status: true,
        totalRows: true,
        successRows: true,
        errorRows: true,
      },
    });

    const importJobMap = new Map(importJobs.map(job => [job.id, job]));

    // Format response
    const formattedItems = items.map(item => {
      const baseItem = {
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        userId: item.userId || null,
        userEmail: item.user?.email || null,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId || null,
        before: item.before,
        after: item.after,
      };

      // Add ImportJob metadata if available
      if (item.action === 'IMPORT' && item.entityId) {
        const importJob = importJobMap.get(item.entityId);
        if (importJob) {
          return {
            ...baseItem,
            importJobStatus: importJob.status,
            importJobTotalRows: importJob.totalRows,
            importJobSuccessRows: importJob.successRows,
            importJobErrorRows: importJob.errorRows,
          };
        }
      }

      return baseItem;
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      items: formattedItems,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (error: any) {
    console.error('Audit log fetch error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
