import { POST } from './route';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

describe('POST /api/admin/import/stones', () => {
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 403 for non-admin users', async () => {
    const csvContent = 'brand,collection,stoneCode,stoneName,colorCode,colorName,m2Price\nTest,Test,T001,Test Stone,TC001,Test Color,1500';
    const formData = new FormData();
    formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv');

    const request = new NextRequest('http://localhost:3000/api/admin/import/stones', {
      method: 'POST',
      headers: {
        'X-User-Id': userUserId,
        'X-User-Email': 'user@test.com',
        'X-User-Role': 'USER',
      },
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(403);

    const data = await response.json() as any;
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns 400 with errors for CSV with row 7 invalid m2Price', async () => {
    const csvRows = [
      'brand,collection,stoneCode,stoneName,colorCode,colorName,m2Price',
      'Brand1,Collection1,S001,Stone 1,C001,Color 1,1500.00',
      'Brand1,Collection1,S002,Stone 2,C002,Color 2,1600.00',
      'Brand1,Collection1,S003,Stone 3,C003,Color 3,1700.00',
      'Brand1,Collection1,S004,Stone 4,C004,Color 4,1800.00',
      'Brand1,Collection1,S005,Stone 5,C005,Color 5,1900.00',
      'Brand1,Collection1,S006,Stone 6,C006,Color 6,2000.00',
      'Brand1,Collection1,S007,Stone 7,C007,Color 7,abc', // Invalid row 8 (row 7 + header)
      'Brand1,Collection1,S008,Stone 8,C008,Color 8,2100.00',
      'Brand1,Collection1,S009,Stone 9,C009,Color 9,2200.00',
      'Brand1,Collection1,S010,Stone 10,C010,Color 10,2300.00',
    ];
    const csvContent = csvRows.join('\n');

    const formData = new FormData();
    formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test-error.csv');

    const request = new NextRequest('http://localhost:3000/api/admin/import/stones', {
      method: 'POST',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
      body: formData,
    });

    // Count stones/colors before import
    const beforeCount = await prisma.stoneColor.count();

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json() as any;
    expect(data.success).toBe(false);
    expect(data.errors).toBeDefined();
    expect(data.errors.length).toBeGreaterThan(0);

    // Find error for row 8 (0-indexed row 7 + header = row 8)
    const row8Error = data.errors.find((e: any) => e.row === 8);
    expect(row8Error).toBeDefined();
    expect(row8Error.field).toBe('m2Price');
    expect(row8Error.reason).toContain('Invalid m2Price format');

    // Verify NO rows inserted (atomic failure)
    const afterCount = await prisma.stoneColor.count();
    expect(afterCount).toBe(beforeCount);

    // Verify ImportJob created with VALIDATION_ERROR
    const importJob = await prisma.importJob.findFirst({
      where: { filename: 'test-error.csv', status: 'VALIDATION_ERROR' },
      orderBy: { createdAt: 'desc' },
    });
    expect(importJob).toBeDefined();
    expect(importJob!.totalRows).toBe(10);
    expect(importJob!.successRows).toBe(0);
    expect(importJob!.errorRows).toBeGreaterThan(0);
  });

  it('imports 10 valid rows successfully and colors are queryable', async () => {
    const csvRows = [
      'brand,collection,stoneCode,stoneName,colorCode,colorName,m2Price,wastePercent',
      'ImportBrand,ImportCollection,IS001,Import Stone 1,IC001,Import Color 1,1500.50,0.05',
      'ImportBrand,ImportCollection,IS002,Import Stone 2,IC002,Import Color 2,1600.75,0.06',
      'ImportBrand,ImportCollection,IS003,Import Stone 3,IC003,Import Color 3,1700.00,',
      'ImportBrand,ImportCollection,IS004,Import Stone 4,IC004,Import Color 4,1800.25,',
      'ImportBrand,ImportCollection,IS005,Import Stone 5,IC005,Import Color 5,1900.00,0.05',
      'ImportBrand,ImportCollection,IS006,Import Stone 6,IC006,Import Color 6,2000.00,0.07',
      'ImportBrand,ImportCollection,IS007,Import Stone 7,IC007,Import Color 7,2100.00,',
      'ImportBrand,ImportCollection,IS008,Import Stone 8,IC008,Import Color 8,2200.50,0.05',
      'ImportBrand,ImportCollection,IS009,Import Stone 9,IC009,Import Color 9,2300.00,',
      'ImportBrand,ImportCollection,IS010,Import Stone 10,IC010,Import Color 10,2400.00,0.08',
    ];
    const csvContent = csvRows.join('\n');

    const formData = new FormData();
    formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test-success.csv');

    const request = new NextRequest('http://localhost:3000/api/admin/import/stones', {
      method: 'POST',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
      body: formData,
    });

    // Spy on console.log to capture cache invalidation logs
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.success).toBe(true);
    expect(data.totalRows).toBe(10);
    expect(data.imported).toBeDefined();
    expect(data.imported.brands).toBeGreaterThanOrEqual(1);
    expect(data.imported.collections).toBeGreaterThanOrEqual(1);
    expect(data.imported.stones).toBeGreaterThanOrEqual(10);
    expect(data.imported.colors).toBe(10);

    // Verify cache invalidation was called with correct tags
    expect(consoleSpy).toHaveBeenCalledWith(
      'Cache invalidation requested for tags:',
      ['stones:v1:all', 'pricing:v1:all']
    );

    consoleSpy.mockRestore();

    // Verify colors are queryable
    const color1 = await prisma.stoneColor.findFirst({
      where: { code: 'IC001' },
      include: { stone: { include: { collection: { include: { brand: true } } } } },
    });
    expect(color1).toBeDefined();
    expect(color1!.nameTr).toBe('Import Color 1');
    expect(color1!.m2Price.toString()).toBe('1500.5');
    expect(color1!.wastePercent?.toString()).toBe('0.05');
    expect(color1!.stone.code).toBe('IS001');
    expect(color1!.stone.collection!.code).toBe('ImportCollection');
    expect(color1!.stone.collection!.brand!.code).toBe('ImportBrand');

    const color7 = await prisma.stoneColor.findFirst({
      where: { code: 'IC007' },
    });
    expect(color7).toBeDefined();
    expect(color7!.wastePercent).toBeNull();

    // Verify ImportJob created with SUCCESS
    const importJob = await prisma.importJob.findFirst({
      where: { filename: 'test-success.csv', status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
    });
    expect(importJob).toBeDefined();
    expect(importJob!.totalRows).toBe(10);
    expect(importJob!.successRows).toBe(10);
    expect(importJob!.errorRows).toBe(0);
    expect(importJob!.errorReport).toBeNull();

    // Verify AuditLog entry
    const auditLog = await prisma.auditLog.findFirst({
      where: { action: 'IMPORT', entityType: 'ImportJob', entityId: importJob!.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditLog).toBeDefined();
    expect(auditLog!.userId).toBe(adminUserId);
  });

  it('returns preview for dryRun=true without writing', async () => {
    const csvRows = [
      'brand,collection,stoneCode,stoneName,colorCode,colorName,m2Price',
      'DryBrand,DryCollection,DS001,Dry Stone 1,DC001,Dry Color 1,1500.00',
      'DryBrand,DryCollection,DS002,Dry Stone 2,DC002,Dry Color 2,1600.00',
      'DryBrand,DryCollection,DS003,Dry Stone 3,DC003,Dry Color 3,1700.00',
    ];
    const csvContent = csvRows.join('\n');

    const formData = new FormData();
    formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test-dry.csv');

    const request = new NextRequest('http://localhost:3000/api/admin/import/stones?dryRun=true', {
      method: 'POST',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
      body: formData,
    });

    const beforeBrandCount = await prisma.stoneBrand.count();

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json() as any;
    expect(data.success).toBe(true);
    expect(data.dryRun).toBe(true);
    expect(data.preview).toBeDefined();
    expect(data.preview.totalRows).toBe(3);
    expect(data.preview.brands).toEqual(['DryBrand']);
    expect(data.preview.collections).toEqual(['DryCollection']);
    expect(data.preview.stones.length).toBe(3);
    expect(data.preview.colors.length).toBe(3);

    // Verify NO data written
    const afterBrandCount = await prisma.stoneBrand.count();
    expect(afterBrandCount).toBe(beforeBrandCount);

    const dryBrand = await prisma.stoneBrand.findFirst({
      where: { code: 'DryBrand' },
    });
    expect(dryBrand).toBeNull();
  });

  it('returns 400 for empty CSV file', async () => {
    const csvContent = 'brand,collection,stoneCode,stoneName,colorCode,colorName,m2Price';
    const formData = new FormData();
    formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'empty.csv');

    const request = new NextRequest('http://localhost:3000/api/admin/import/stones', {
      method: 'POST',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json() as any;
    expect(data.error.code).toBe('EMPTY_FILE');
  });

  it('returns 400 for missing file', async () => {
    const formData = new FormData();

    const request = new NextRequest('http://localhost:3000/api/admin/import/stones', {
      method: 'POST',
      headers: {
        'X-User-Id': adminUserId,
        'X-User-Email': 'admin@test.com',
        'X-User-Role': 'ADMIN',
      },
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json() as any;
    expect(data.error.code).toBe('FILE_REQUIRED');
  });
});
