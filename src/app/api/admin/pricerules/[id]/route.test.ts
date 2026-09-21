/**
 * Integration tests for /api/admin/pricerules/[id]
 */

import { GET, PATCH } from './route';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

let testAdminId: string;
let testUserId: string;
let testRuleId: string;

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

  const sinkHole = await prisma.priceRule.findFirst({
    where: { code: 'SINK_HOLE' },
  });
  testRuleId = sinkHole!.id;
});

describe('GET /api/admin/pricerules/[id]', () => {

  it('returns 403 for non-admin users', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/admin/pricerules/${testRuleId}`,
      {
        headers: {
          'X-User-Id': testUserId,
          'X-User-Role': 'USER',
        },
      }
    );

    const response = await GET(request, { params: { id: testRuleId } });
    const data = await response.json() as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns price rule by ID for admin', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/admin/pricerules/${testRuleId}`,
      {
        headers: {
          'X-User-Id': testAdminId,
          'X-User-Role': 'ADMIN',
        },
      }
    );

    const response = await GET(request, { params: { id: testRuleId } });
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.id).toBe(testRuleId);
    expect(data.code).toBe('SINK_HOLE');
    expect(data.value).toBe('300.00');
  });

  it('returns 404 for non-existent ID', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/admin/pricerules/clxxxxxxxxxxxxxxxxxxxxxxxxx',
      {
        headers: {
          'X-User-Id': testAdminId,
          'X-User-Role': 'ADMIN',
        },
      }
    );

    const response = await GET(request, {
      params: { id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx' },
    });
    const data = await response.json() as any;

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('NOT_FOUND');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});

describe('PATCH /api/admin/pricerules/[id]', () => {

  it('returns 403 for non-admin users', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/admin/pricerules/${testRuleId}`,
      {
        method: 'PATCH',
        headers: {
          'X-User-Id': testUserId,
          'X-User-Role': 'USER',
        },
        body: JSON.stringify({ value: 350 }),
      }
    );

    const response = await PATCH(request, { params: { id: testRuleId } });
    const data = await response.json() as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('updates price rule value for admin', async () => {
    const request = new NextRequest(
      `http://localhost:3000/api/admin/pricerules/${testRuleId}`,
      {
        method: 'PATCH',
        headers: {
          'X-User-Id': testAdminId,
          'X-User-Role': 'ADMIN',
        },
        body: JSON.stringify({ value: 350 }),
      }
    );

    const response = await PATCH(request, { params: { id: testRuleId } });
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.id).toBe(testRuleId);
    expect(data.value).toBe('350.00');

    // Verify audit log was created
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        entityType: 'PriceRule',
        entityId: testRuleId,
        action: 'UPDATE',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditLog).toBeDefined();
    expect(auditLog?.userId).toBe(testAdminId);

    // Restore original value
    await prisma.priceRule.update({
      where: { id: testRuleId },
      data: { value: 300 },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
