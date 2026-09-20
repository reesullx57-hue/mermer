import { NextRequest } from 'next/server';
import { GET, PATCH } from './route';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

describe('GET /api/admin/tax-configs', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'tax-admin@test.local' },
      update: {},
      create: {
        email: 'tax-admin@test.local',
        name: 'Tax Admin',
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
    const request = new NextRequest('http://localhost:3000/api/admin/tax-configs');
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('returns list of tax configs for admin', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/tax-configs');
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await GET(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(data.configs).toBeDefined();
    expect(Array.isArray(data.configs)).toBe(true);
    expect(data.configs.length).toBeGreaterThan(0);

    const config = data.configs[0];
    expect(config).toHaveProperty('code');
    expect(config).toHaveProperty('vatRate');
    expect(/^\d+\.\d{4}$/.test(config.vatRate)).toBe(true);
  });
});

describe('PATCH /api/admin/tax-configs', () => {
  let testAdminUserId: string;

  beforeAll(async () => {
    const admin = await prisma.user.upsert({
      where: { email: 'tax-admin@test.local' },
      update: {},
      create: {
        email: 'tax-admin@test.local',
        name: 'Tax Admin',
        passwordHash: 'test-hash',
        role: 'ADMIN',
      },
    });
    testAdminUserId = admin.id;

    // Ensure VAT_TR is at 0.20
    await prisma.taxConfig.update({
      where: { code: 'VAT_TR' },
      data: { vatRate: new Decimal(0.20) },
    });
  });

  afterAll(async () => {
    // Restore VAT_TR to 0.20
    await prisma.taxConfig.update({
      where: { code: 'VAT_TR' },
      data: { vatRate: new Decimal(0.20) },
    });

    await prisma.$disconnect();
  });

  it('returns 403 for non-admin users', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/tax-configs?code=VAT_TR', {
      method: 'PATCH',
      body: JSON.stringify({
        vatRate: 0.19,
      }),
    });
    request.headers.set('X-User-Id', 'user-123');
    request.headers.set('X-User-Role', 'USER');

    const response = await PATCH(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(403);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('updates VAT rate for admin', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/tax-configs?code=VAT_TR', {
      method: 'PATCH',
      body: JSON.stringify({
        vatRate: 0.22,
      }),
    });
    request.headers.set('X-User-Id', testAdminUserId);
    request.headers.set('X-User-Role', 'ADMIN');

    const response = await PATCH(request);
    const data = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(data.config).toBeDefined();
    expect(data.config.vatRate).toBe('0.2200');

    // Restore
    await prisma.taxConfig.update({
      where: { code: 'VAT_TR' },
      data: { vatRate: new Decimal(0.20) },
    });
  });
});
