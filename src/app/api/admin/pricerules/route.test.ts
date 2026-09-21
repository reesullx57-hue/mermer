/**
 * Integration tests for /api/admin/pricerules
 * Tests admin authorization and CRUD operations
 */

import { GET, POST } from './route';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

let testAdminId: string;
let testUserId: string;

beforeAll(async () => {
  // Create test users
  const admin = await prisma.user.upsert({
    where: { email: 'test-admin@example.com' },
    update: {},
    create: {
      email: 'test-admin@example.com',
      passwordHash: 'test-hash',
      role: 'ADMIN',
    },
  });
  testAdminId = admin.id;

  const user = await prisma.user.upsert({
    where: { email: 'test-user@example.com' },
    update: {},
    create: {
      email: 'test-user@example.com',
      passwordHash: 'test-hash',
      role: 'USER',
    },
  });
  testUserId = user.id;
});

describe('GET /api/admin/pricerules', () => {
  it('returns 403 for non-admin users', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/pricerules', {
      headers: {
        'X-User-Id': testUserId,
        'X-User-Role': 'USER', // Not ADMIN
      },
    });

    const response = await GET(request);
    const data = await response.json() as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
    expect(data.error.message).toBe('Admin role required');
  });

  it('returns 403 for unauthenticated users', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/pricerules');

    const response = await GET(request);
    const data = await response.json() as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns list of active price rules for admin', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/pricerules', {
      headers: {
        'X-User-Id': testAdminId,
        'X-User-Role': 'ADMIN',
      },
    });

    const response = await GET(request);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Verify structure
    const firstRule = data[0];
    expect(firstRule).toHaveProperty('id');
    expect(firstRule).toHaveProperty('code');
    expect(firstRule).toHaveProperty('nameTr');
    expect(firstRule).toHaveProperty('value');
    expect(firstRule).toHaveProperty('unit');
    expect(firstRule).toHaveProperty('isActive');

    // Verify seeded rules
    const codes = data.map((r: any) => r.code);
    expect(codes).toContain('SINK_HOLE');
    expect(codes).toContain('COOKTOP_HOLE');
    expect(codes).toContain('INSTALL');
  });

  it('returns all rules (including inactive) when all=true', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/pricerules?all=true', {
      headers: {
        'X-User-Id': testAdminId,
        'X-User-Role': 'ADMIN',
      },
    });

    const response = await GET(request);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});

describe('POST /api/admin/pricerules', () => {
  it('returns 403 for non-admin users', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/pricerules', {
      method: 'POST',
      headers: {
        'X-User-Id': testUserId,
        'X-User-Role': 'USER',
      },
      body: JSON.stringify({
        code: 'TEST_RULE',
        nameTr: 'Test Kuralı',
        value: 100,
        unit: 'TRY',
      }),
    });

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('creates new price rule for admin', async () => {
    const testCode = `TEST_RULE_${Date.now()}`;
    const request = new NextRequest('http://localhost:3000/api/admin/pricerules', {
      method: 'POST',
      headers: {
        'X-User-Id': testAdminId,
        'X-User-Role': 'ADMIN',
      },
      body: JSON.stringify({
        code: testCode,
        nameTr: 'Test Kuralı',
        value: 150.5,
        unit: 'TRY',
      }),
    });

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(201);
    expect(data.code).toBe(testCode);
    expect(data.nameTr).toBe('Test Kuralı');
    expect(data.value).toBe('150.50');
    expect(data.unit).toBe('TRY');
    expect(data.isActive).toBe(true);

    // Verify audit log was created
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        entityType: 'PriceRule',
        entityId: data.id,
        action: 'CREATE',
      },
    });
    expect(auditLog).toBeDefined();
    expect(auditLog?.userId).toBe(testAdminId);

    // Cleanup
    await prisma.priceRule.delete({ where: { id: data.id } });
    await prisma.auditLog.deleteMany({ where: { entityId: data.id } });
  });

  it('returns 409 for duplicate code', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/pricerules', {
      method: 'POST',
      headers: {
        'X-User-Id': testAdminId,
        'X-User-Role': 'ADMIN',
      },
      body: JSON.stringify({
        code: 'SINK_HOLE', // Already exists
        nameTr: 'Duplicate',
        value: 100,
        unit: 'TRY',
      }),
    });

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(409);
    expect(data.error.code).toBe('CONFLICT');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
