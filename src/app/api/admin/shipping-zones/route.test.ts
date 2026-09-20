import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/admin/shipping-zones', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'shipping-admin@test.local' },
      update: {},
      create: {
        email: 'shipping-admin@test.local',
        name: 'Shipping Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/shipping-zones');
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns list of shipping zones for admin', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/shipping-zones');
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(data.zones).toBeDefined();
    expect(Array.isArray(data.zones)).toBe(true);
    expect(data.zones.length).toBeGreaterThan(0);

    const zone = data.zones[0];
    expect(zone).toHaveProperty('city');
    expect(zone).toHaveProperty('district');
    expect(zone).toHaveProperty('fee');
    expect(/^\d+\.\d{2}$/.test(zone.fee)).toBe(true);
  });
});

describe('POST /api/admin/shipping-zones', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'shipping-admin@test.local' },
      update: {},
      create: {
        email: 'shipping-admin@test.local',
        name: 'Shipping Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/shipping-zones', {
      method: 'POST',
      body: JSON.stringify({
        city: 'Test City',
        district: 'Test District',
        fee: 350,
      }),
    });
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('creates new shipping zone for admin', async () => {
    const city = `Test City ${Date.now()}`;

    const request = new NextRequest('http://localhost:3000/api/admin/shipping-zones', {
      method: 'POST',
      body: JSON.stringify({
        city,
        district: 'Test District',
        fee: 375,
        installAvailable: true,
        isActive: true,
      }),
    });
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(201);
    expect(data.zone).toBeDefined();
    expect(data.zone.city).toBe(city);
    expect(data.zone.fee).toBe('375.00');

    // Cleanup
    await prisma.shippingZone.delete({ where: { id: data.zone.id } });
  });
});
