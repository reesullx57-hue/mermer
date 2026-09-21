/**
 * Sample Audit API Response
 * Demonstrates GET /api/admin/audit response structure
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateSampleResponse() {
  console.log('='.repeat(100));
  console.log('GET /api/admin/audit - Sample Response');
  console.log('='.repeat(100));
  console.log('');

  // Get admin user
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.log('No admin user found');
    await prisma.$disconnect();
    return;
  }

  console.log('SAMPLE REQUEST:');
  console.log('  GET /api/admin/audit?entityType=PriceRule&pageSize=5');
  console.log('  Headers: X-User-Role: ADMIN');
  console.log('');

  // Fetch sample audit logs
  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'PriceRule' },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const total = await prisma.auditLog.count({ where: { entityType: 'PriceRule' } });

  const sampleResponse = {
    items: auditLogs.map(log => ({
      id: log.id,
      createdAt: log.createdAt.toISOString(),
      userId: log.userId,
      userEmail: log.user?.email || null,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      before: log.before,
      after: log.after,
    })),
    page: 1,
    pageSize: 5,
    total: total,
    totalPages: Math.ceil(total / 5),
  };

  console.log('SAMPLE RESPONSE (200):');
  console.log(JSON.stringify(sampleResponse, null, 2));
  console.log('');

  // Sample IMPORT action with ImportJob metadata
  const importLogs = await prisma.auditLog.findMany({
    where: { action: 'IMPORT' },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 2,
  });

  if (importLogs.length > 0) {
    const importJobIds = importLogs
      .filter(log => log.entityId)
      .map(log => log.entityId!);

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

    console.log('SAMPLE IMPORT ACTIONS WITH METADATA:');
    console.log('  GET /api/admin/audit?action=IMPORT&pageSize=2');
    console.log('');

    const importResponse = {
      items: importLogs.map(log => {
        const baseItem = {
          id: log.id,
          createdAt: log.createdAt.toISOString(),
          userId: log.userId,
          userEmail: log.user?.email || null,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          before: log.before,
          after: log.after,
        };

        if (log.entityId) {
          const importJob = importJobMap.get(log.entityId);
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
      }),
      page: 1,
      pageSize: 2,
      total: await prisma.auditLog.count({ where: { action: 'IMPORT' } }),
      totalPages: Math.ceil((await prisma.auditLog.count({ where: { action: 'IMPORT' } })) / 2),
    };

    console.log('RESPONSE (200):');
    console.log(JSON.stringify(importResponse, null, 2));
    console.log('');
  }

  console.log('AVAILABLE FILTERS:');
  console.log('  - entityType: PriceRule, StoneColor, StoneCollection, ImportJob, ...');
  console.log('  - entityId: specific entity cuid');
  console.log('  - userId: specific user cuid');
  console.log('  - action: CREATE, UPDATE, DELETE, IMPORT');
  console.log('  - from: ISO date string (createdAt >= from)');
  console.log('  - to: ISO date string (createdAt <= to)');
  console.log('  - page: page number (1-indexed, default 1)');
  console.log('  - pageSize: items per page (default 50, max 100)');
  console.log('');

  console.log('SAMPLE QUERIES:');
  console.log('  1. All recent activity: GET /api/admin/audit');
  console.log('  2. PriceRule updates: GET /api/admin/audit?entityType=PriceRule&action=UPDATE');
  console.log('  3. Recent imports: GET /api/admin/audit?action=IMPORT');
  console.log('  4. User activity: GET /api/admin/audit?userId=<user-id>');
  console.log('  5. Date range: GET /api/admin/audit?from=2026-09-01&to=2026-09-21');
  console.log('  6. Paginated: GET /api/admin/audit?page=2&pageSize=20');
  console.log('');

  await prisma.$disconnect();
}

generateSampleResponse().catch(console.error);
