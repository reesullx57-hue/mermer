import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/admin/stones', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'stone-admin@test.local' },
      update: {},
      create: {
        email: 'stone-admin@test.local',
        name: 'Stone Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/stones');
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns list of stones for admin', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/stones');
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(data.stones).toBeDefined();
    expect(Array.isArray(data.stones)).toBe(true);
  });
});

describe('POST /api/admin/stones', () => {
  let testAdminUserId: string;
  let testBrandId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'stone-admin@test.local' },
      update: {},
      create: {
        email: 'stone-admin@test.local',
        name: 'Stone Admin',
        passwordHash: 'test-hash',
        role: 'ADMIN',
      },
    });
    testAdminUserId = admin.id;

    const brand = await prisma.stoneBrand.findFirst({ where: { isActive: true } });
    if (!brand) {
      throw new Error('No active stone brand found for testing');
    }
    testBrandId = brand.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 403 for non-admin users', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/stones', {
      method: 'POST',
      body: JSON.stringify({
        brandId: testBrandId,
        code: 'TEST_STONE',
        nameTr: 'Test Stone',
      }),
    });
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('creates new stone for admin', async () => {
    const code = `TEST_STONE_${Date.now()}`;

    const request = new NextRequest('http://localhost:3000/api/admin/stones', {
      method: 'POST',
      body: JSON.stringify({
        brandId: testBrandId,
        code,
        nameTr: 'Test Stone',
        isActive: true,
      }),
    });
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(201);
    expect(data.stone).toBeDefined();
    expect(data.stone.code).toBe(code);

    // Cleanup
    await prisma.stone.delete({ where: { id: data.stone.id } });
  });
});
