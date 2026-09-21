import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

describe('GET /api/admin/stone-colors', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'color-admin@test.local' },
      update: {},
      create: {
        email: 'color-admin@test.local',
        name: 'Color Admin',
        passwordHash: 'test-hash',
        role: 'ADMIN',
      },
    });
    testAdminUserId = admin.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 403 for non-admin users', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/stone-colors');
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns list of stone colors for admin', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/stone-colors');
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(data.colors).toBeDefined();
    expect(Array.isArray(data.colors)).toBe(true);
    expect(data.colors.length).toBeGreaterThan(0);

    const color = data.colors[0];
    expect(color).toHaveProperty('id');
    expect(color).toHaveProperty('stoneId');
    expect(color).toHaveProperty('code');
    expect(color).toHaveProperty('nameTr');
    expect(color).toHaveProperty('m2Price');
    expect(color).toHaveProperty('isActive');
    expect(color).toHaveProperty('stone');

    // Verify m2Price formatting
    expect(typeof color.m2Price).toBe('string');
    expect(/^\d+\.\d{2}$/.test(color.m2Price)).toBe(true);
  });
});

describe('POST /api/admin/stone-colors', () => {
  let testAdminUserId: string;
  let testStoneId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'color-admin@test.local' },
      update: {},
      create: {
        email: 'color-admin@test.local',
        name: 'Color Admin',
        passwordHash: 'test-hash',
        role: 'ADMIN',
      },
    });
    testAdminUserId = admin.id;

    const stone = await prisma.stone.findFirst({ where: { isActive: true } });
    if (!stone) {
      throw new Error('No active stone found for testing');
    }
    testStoneId = stone.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 403 for non-admin users', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/stone-colors', {
      method: 'POST',
      body: JSON.stringify({
        stoneId: testStoneId,
        code: 'TEST_COLOR',
        nameTr: 'Test Color',
        m2Price: 1500,
      }),
    });
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('creates new stone color for admin', async () => {
    const code = `TEST_COLOR_${Date.now()}`;

    const request = new NextRequest('http://localhost:3000/api/admin/stone-colors', {
      method: 'POST',
      body: JSON.stringify({
        stoneId: testStoneId,
        code,
        nameTr: 'Test Color',
        m2Price: 1750.5,
        wastePercent: 0.06,
        isActive: true,
      }),
    });
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(201);
    expect(data.color).toBeDefined();
    expect(data.color.code).toBe(code);
    expect(data.color.m2Price).toBe('1750.50');
    expect(data.color.wastePercent).toBe('0.0600');

    // Cleanup
    await prisma.stoneColor.delete({ where: { id: data.color.id } });
  });

  it('returns 404 for non-existent stone', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/stone-colors', {
      method: 'POST',
      body: JSON.stringify({
        stoneId: 'clx000000000000000000000',
        code: 'TEST_COLOR',
        nameTr: 'Test Color',
        m2Price: 1500,
      }),
    });
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('STONE_NOT_FOUND');
  });
});
