import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/admin/stone-brands', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'brand-admin@test.local' },
      update: {},
      create: {
        email: 'brand-admin@test.local',
        name: 'Brand Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/stone-brands');
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns list of stone brands for admin', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/stone-brands');
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(data.brands).toBeDefined();
    expect(Array.isArray(data.brands)).toBe(true);
    expect(data.brands.length).toBeGreaterThan(0);

    const brand = data.brands[0];
    expect(brand).toHaveProperty('id');
    expect(brand).toHaveProperty('code');
    expect(brand).toHaveProperty('nameTr');
    expect(brand).toHaveProperty('isActive');
    expect(brand).toHaveProperty('_count');
  });
});

describe('POST /api/admin/stone-brands', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'brand-admin@test.local' },
      update: {},
      create: {
        email: 'brand-admin@test.local',
        name: 'Brand Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/stone-brands', {
      method: 'POST',
      body: JSON.stringify({
        code: 'TEST_BRAND',
        nameTr: 'Test Brand',
      }),
    });
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('creates new stone brand for admin', async () => {
    const code = `TEST_BRAND_${Date.now()}`;

    const request = new NextRequest('http://localhost:3000/api/admin/stone-brands', {
      method: 'POST',
      body: JSON.stringify({
        code,
        nameTr: 'Test Brand',
        isActive: true,
      }),
    });
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(201);
    expect(data.brand).toBeDefined();
    expect(data.brand.code).toBe(code);
    expect(data.brand.nameTr).toBe('Test Brand');

    // Cleanup
    await prisma.stoneBrand.delete({ where: { id: data.brand.id } });
  });

  it('returns 409 for duplicate code', async () => {
    const existing = await prisma.stoneBrand.findFirst({ where: { isActive: true } });

    const request = new NextRequest('http://localhost:3000/api/admin/stone-brands', {
      method: 'POST',
      body: JSON.stringify({
        code: existing!.code,
        nameTr: 'Duplicate Brand',
      }),
    });
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(409);
    expect(data.error.code).toBe('DUPLICATE_CODE');
  });
});
