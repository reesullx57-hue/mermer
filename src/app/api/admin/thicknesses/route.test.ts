import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/admin/thicknesses', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'thickness-admin@test.local' },
      update: {},
      create: {
        email: 'thickness-admin@test.local',
        name: 'Thickness Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/thicknesses');
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns list of thicknesses for admin', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/thicknesses');
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(data.thicknesses).toBeDefined();
    expect(Array.isArray(data.thicknesses)).toBe(true);
    expect(data.thicknesses.length).toBeGreaterThan(0);

    const thickness = data.thicknesses[0];
    expect(thickness).toHaveProperty('cm');
    expect(thickness).toHaveProperty('code');
    expect(thickness).toHaveProperty('coefficient');
    expect(/^\d+\.\d{2}$/.test(thickness.coefficient)).toBe(true);
  });
});

describe('POST /api/admin/thicknesses', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'thickness-admin@test.local' },
      update: {},
      create: {
        email: 'thickness-admin@test.local',
        name: 'Thickness Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/thicknesses', {
      method: 'POST',
      body: JSON.stringify({
        cm: 5,
        nameTr: '5cm',
        coefficient: 1.35,
      }),
    });
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('creates new thickness for admin', async () => {
    const cm = Math.floor(Math.random() * 90) + 10;

    const request = new NextRequest('http://localhost:3000/api/admin/thicknesses', {
      method: 'POST',
      body: JSON.stringify({
        cm,
        nameTr: `${cm}cm Test`,
        coefficient: 1.45,
        isActive: true,
      }),
    });
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(201);
    expect(data.thickness).toBeDefined();
    expect(data.thickness.cm).toBe(cm);
    expect(data.thickness.coefficient).toBe('1.45');

    // Cleanup
    await prisma.thickness.delete({ where: { id: data.thickness.id } });
  });
});
