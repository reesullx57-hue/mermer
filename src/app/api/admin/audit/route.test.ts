import { GET } from './route';
import { PrismaClient, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

describe('GET /api/admin/audit', () => {
  let adminUserId: string;
  let userUserId: string;

  beforeAll(async () => {
    // Create test users
    const admin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: { role: 'ADMIN' },
      create: {
        email: 'admin@test.com',
        name: 'Admin User',
        passwordHash: 'dummy',
        role: 'ADMIN',
      },
    });
    adminUserId = admin.id;

    const user = await prisma.user.upsert({
      where: { email: 'user@test.com' },
      update: { role: 'USER' },
      create: {
        email: 'user@test.com',
        name: 'Regular User',
        passwordHash: 'dummy',
        role: 'USER',
      },
    });
    userUserId = user.id;

    // Create test audit logs
    const testLogs = [];
    
    // Create 15 PriceRule audit logs
    for (let i = 1; i <= 15; i++) {
      testLogs.push(
        prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'UPDATE',
            entityType: 'PriceRule',
            entityId: `price-rule-${i}`,
            before: { value: i * 100 },
            after: { value: i * 100 + 50 },
          },
        })
      );
    }

    // Create 5 StoneColor audit logs
    for (let i = 1; i <= 5; i++) {
      testLogs.push(
        prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'CREATE',
            entityType: 'StoneColor',
            entityId: `stone-color-${i}`,
            before: Prisma.JsonNull,
            after: { m2Price: i * 1500 },
          },
        })
      );
    }

    // Create 3 IMPORT audit logs
    for (let i = 1; i <= 3; i++) {
      const importJob = await prisma.importJob.create({
        data: {
          userId: adminUserId,
          entityType: 'Stone',
          filename: `test-import-${i}.csv`,
          totalRows: 10,
          successRows: i === 2 ? 0 : 10,
          errorRows: i === 2 ? 1 : 0,
          status: i === 2 ? 'VALIDATION_ERROR' : 'SUCCESS',
          errorReport: i === 2 ? ([{ row: 5, field: 'm2Price', reason: 'Invalid' }] as any) : Prisma.JsonNull,
        },
      });

      testLogs.push(
        prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'IMPORT',
            entityType: 'ImportJob',
            entityId: importJob.id,
            before: Prisma.JsonNull,
            after: { filename: `test-import-${i}.csv`, totalRows: 10 },
          },
        })
      );
    }

    await Promise.all(testLogs);
  });

  afterAll(async () => {
    // Clean up test audit logs
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { entityId: { contains: 'price-rule-' } },
          { entityId: { contains: 'stone-color-' } },
          { action: 'IMPORT' },
        ],
      },
    });
    await prisma.importJob.deleteMany({
      where: { filename: { contains: 'test-import-' } },
    });
    await prisma.$disconnect();
  });

  it('returns 403 for non-admin users', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/audit', {
      method: 'GET',
      headers: {
        'X-User-Id': userUserId,
        'X-User-Email': 'user@test.com',
        'X-User-Role': 'USER',
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(403);

    const data = await response.json() as any;
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns all items with default pageSize 50 when total < 50', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/audit', {
      method: 'GET',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.items).toBeDefined();
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items.length).toBeLessThanOrEqual(50);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(50);
    expect(data.total).toBeGreaterThanOrEqual(23); // At least our test logs
    expect(data.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('handles pagination with page 2 and pageSize 10', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/audit?page=2&pageSize=10', {
      method: 'GET',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.items).toBeDefined();
    expect(data.items.length).toBeLessThanOrEqual(10);
    expect(data.page).toBe(2);
    expect(data.pageSize).toBe(10);
    expect(data.totalPages).toBeGreaterThanOrEqual(2);

    // Verify items structure
    if (data.items.length > 0) {
      const item = data.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('userId');
      expect(item).toHaveProperty('action');
      expect(item).toHaveProperty('entityType');
    }
  });

  it('filters by entityType=PriceRule and returns only those', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/audit?entityType=PriceRule&pageSize=100', {
      method: 'GET',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.items).toBeDefined();
    expect(data.items.length).toBeGreaterThanOrEqual(15); // Our 15 test PriceRule logs

    // Verify all items are PriceRule
    data.items.forEach((item: any) => {
      expect(item.entityType).toBe('PriceRule');
    });

    // Verify structure
    if (data.items.length > 0) {
      const item = data.items[0];
      expect(item.action).toBe('UPDATE');
      expect(item.before).toBeDefined();
      expect(item.after).toBeDefined();
    }
  });

  it('filters by entityType=StoneColor and returns only those', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/audit?entityType=StoneColor&pageSize=100', {
      method: 'GET',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.items).toBeDefined();
    expect(data.items.length).toBeGreaterThanOrEqual(5); // Our 5 test StoneColor logs

    // Verify all items are StoneColor
    data.items.forEach((item: any) => {
      expect(item.entityType).toBe('StoneColor');
    });

    // Verify CREATE actions
    data.items.forEach((item: any) => {
      if (item.entityId?.includes('stone-color-')) {
        expect(item.action).toBe('CREATE');
        expect(item.before).toBeNull();
        expect(item.after).toBeDefined();
      }
    });
  });

  it('includes ImportJob metadata for IMPORT actions', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/audit?action=IMPORT&pageSize=100', {
      method: 'GET',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.items).toBeDefined();
    expect(data.items.length).toBeGreaterThanOrEqual(3); // Our 3 test IMPORT logs

    // Verify all items are IMPORT actions
    data.items.forEach((item: any) => {
      expect(item.action).toBe('IMPORT');
    });

    // Find SUCCESS and VALIDATION_ERROR imports
    const successImport = data.items.find((item: any) => item.importJobStatus === 'SUCCESS');
    const failedImport = data.items.find((item: any) => item.importJobStatus === 'VALIDATION_ERROR');

    if (successImport) {
      expect(successImport.importJobTotalRows).toBe(10);
      expect(successImport.importJobSuccessRows).toBe(10);
      expect(successImport.importJobErrorRows).toBe(0);
    }

    if (failedImport) {
      expect(failedImport.importJobTotalRows).toBe(10);
      expect(failedImport.importJobSuccessRows).toBe(0);
      expect(failedImport.importJobErrorRows).toBe(1);
    }
  });

  it('filters by action=UPDATE', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/audit?action=UPDATE&pageSize=100', {
      method: 'GET',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.items).toBeDefined();

    // Verify all items are UPDATE actions
    data.items.forEach((item: any) => {
      expect(item.action).toBe('UPDATE');
      expect(item.before).toBeDefined();
      expect(item.after).toBeDefined();
    });
  });

  it('includes userEmail in response', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/audit?pageSize=10', {
      method: 'GET',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.items).toBeDefined();

    // Verify userEmail is included
    if (data.items.length > 0) {
      const item = data.items[0];
      if (item.userId) {
        expect(item.userEmail).toBeDefined();
      }
    }
  });

  it('respects max pageSize of 100', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/audit?pageSize=200', {
      method: 'GET',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.pageSize).toBe(100); // Capped at max
    expect(data.items.length).toBeLessThanOrEqual(100);
  });

  it('returns items ordered by createdAt DESC (newest first)', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/audit?pageSize=10', {
      method: 'GET',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.items).toBeDefined();

    if (data.items.length > 1) {
      // Verify descending order
      for (let i = 0; i < data.items.length - 1; i++) {
        const current = new Date(data.items[i].createdAt);
        const next = new Date(data.items[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    }
  });
});
