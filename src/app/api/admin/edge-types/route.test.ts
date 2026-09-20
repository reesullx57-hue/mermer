import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/admin/edge-types', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'edgetype-admin@test.local' },
      update: {},
      create: {
        email: 'edgetype-admin@test.local',
        name: 'EdgeType Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/edge-types');
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns list of edge types for admin', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/edge-types');
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(data.edgeTypes).toBeDefined();
    expect(Array.isArray(data.edgeTypes)).toBe(true);
    expect(data.edgeTypes.length).toBeGreaterThan(0);
  });
});

describe('POST /api/admin/edge-types', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'edgetype-admin@test.local' },
      update: {},
      create: {
        email: 'edgetype-admin@test.local',
        name: 'EdgeType Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/edge-types', {
      method: 'POST',
      body: JSON.stringify({
        code: 'TEST_EDGE',
        nameTr: 'Test Edge',
        coefficient: 1.18,
      }),
    });
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('creates new edge type for admin', async () => {
    const code = `TEST_EDGE_${Date.now()}`;

    const request = new NextRequest('http://localhost:3000/api/admin/edge-types', {
      method: 'POST',
      body: JSON.stringify({
        code,
        nameTr: 'Test Edge Type',
        coefficient: 1.22,
        isActive: true,
      }),
    });
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(201);
    expect(data.edgeType).toBeDefined();
    expect(data.edgeType.code).toBe(code);
    expect(data.edgeType.coefficient).toBe('1.22');

    // Cleanup
    await prisma.edgeType.delete({ where: { id: data.edgeType.id } });
  });
});
