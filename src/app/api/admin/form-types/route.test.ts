import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/admin/form-types', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'formtype-admin@test.local' },
      update: {},
      create: {
        email: 'formtype-admin@test.local',
        name: 'FormType Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/form-types');
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns list of form types for admin', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/form-types');
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(data.formTypes).toBeDefined();
    expect(Array.isArray(data.formTypes)).toBe(true);
    expect(data.formTypes.length).toBeGreaterThan(0);
  });
});

describe('POST /api/admin/form-types', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'formtype-admin@test.local' },
      update: {},
      create: {
        email: 'formtype-admin@test.local',
        name: 'FormType Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/form-types', {
      method: 'POST',
      body: JSON.stringify({
        code: 'TEST_FORM',
        nameTr: 'Test Form',
        coefficient: 1.25,
      }),
    });
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('creates new form type for admin', async () => {
    const code = `TEST_FORM_${Date.now()}`;

    const request = new NextRequest('http://localhost:3000/api/admin/form-types', {
      method: 'POST',
      body: JSON.stringify({
        code,
        nameTr: 'Test Form Type',
        coefficient: 1.28,
        isActive: true,
      }),
    });
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await POST(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(201);
    expect(data.formType).toBeDefined();
    expect(data.formType.code).toBe(code);
    expect(data.formType.coefficient).toBe('1.28');

    // Cleanup
    await prisma.formType.delete({ where: { id: data.formType.id } });
  });
});
