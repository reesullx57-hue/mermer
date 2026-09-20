import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/admin/stone-collections', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'collection-admin@test.local' },
      update: {},
      create: {
        email: 'collection-admin@test.local',
        name: 'Collection Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/stone-collections');
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns list of stone collections for admin', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/stone-collections');
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(data.collections).toBeDefined();
    expect(Array.isArray(data.collections)).toBe(true);
  });
});

describe('POST /api/admin/stone-collections', () => {
  let testAdminUserId: string;
  let testBrandId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'collection-admin@test.local' },
      update: {},
      create: {
        email: 'collection-admin@test.local',
        name: 'Collection Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/stone-collections', {
      method: 'POST',
      body: JSON.stringify({
        brandId: testBrandId,
        code: 'TEST_COLLECTION',
        nameTr: 'Test Collection',
      }),
    });
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('creates new stone collection for admin', async () => {
    const code = `TEST_COLL_${Date.now()}`;

    const request = new NextRequest('http://localhost:3000/api/admin/stone-collections', {
      method: 'POST',
      body: JSON.stringify({
        brandId: testBrandId,
        code,
        nameTr: 'Test Collection',
        isActive: true,
      }),
    });
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(201);
    expect(data.collection).toBeDefined();
    expect(data.collection.code).toBe(code);

    // Cleanup
    await prisma.stoneCollection.delete({ where: { id: data.collection.id } });
  });
});
