/**
 * Integration tests for POST /api/pricing/quote
 */

import { POST } from './route';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

describe('POST /api/pricing/quote', () => {
  let stoneColorId: string;
  let thicknessId: string;
  let formTypeId: string;
  let edgeTypeId: string;

  beforeAll(async () => {
    // Find seed data IDs
    const stoneColor = await prisma.stoneColor.findFirst({
      where: { code: 'WHITE', stone: { code: 'QUARTZ-001' } },
    });
    const thickness = await prisma.thickness.findFirst({
      where: { cm: 3 },
    });
    const formType = await prisma.formType.findFirst({
      where: { code: 'L' },
    });
    const edgeType = await prisma.edgeType.findFirst({
      where: { code: 'RADIUS' },
    });

    if (!stoneColor || !thickness || !formType || !edgeType) {
      throw new Error('Seed data not found');
    }

    stoneColorId = stoneColor.id;
    thicknessId = thickness.id;
    formTypeId = formType.id;
    edgeTypeId = edgeType.id;
  });

  it('Golden A: returns 9809.98 TRY for L form with services', async () => {
    const requestBody = {
      stoneColorId,
      thicknessId,
      formTypeId,
      edgeTypeId,
      dimensions: {
        formType: 'L',
        leg1: 320,
        leg2: 180,
        depth: 65,
      },
      sinkHoles: 1,
      cooktopHole: true,
      install: true,
      skirtingEnabled: false,
      trimEnabled: false,
      address: {
        city: 'İstanbul',
        district: 'Kadıköy',
      },
    };

    const request = new NextRequest('http://localhost:3000/api/pricing/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();

    // Verify money totals
    expect(data.data.subtotalExVat).toBe('8174.98');
    expect(data.data.vatAmount).toBe('1635.00');
    expect(data.data.totalInclVat).toBe('9809.98');

    // Verify pricing snapshot is included
    expect(data.data.pricingSnapshot).toBeDefined();
    expect(data.data.pricingSnapshot.contractVersion).toBe('1.0.0');
    expect(data.data.pricingSnapshot.totalInclVat).toBe('9809.98');
  });

  it('Golden B: returns 8909.98 TRY for L form with skirting+trim', async () => {
    const requestBody = {
      stoneColorId,
      thicknessId,
      formTypeId,
      edgeTypeId,
      dimensions: {
        formType: 'L',
        leg1: 320,
        leg2: 180,
        depth: 65,
      },
      sinkHoles: 0,
      cooktopHole: false,
      install: false,
      skirtingEnabled: true,
      skirtingHeightCm: 10,
      trimEnabled: true,
      trimModel: 'standard',
    };

    const request = new NextRequest('http://localhost:3000/api/pricing/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify money totals
    expect(data.data.subtotalExVat).toBe('7424.98');
    expect(data.data.vatAmount).toBe('1485.00');
    expect(data.data.totalInclVat).toBe('8909.98');
  });

  it('returns 400 for invalid input', async () => {
    const invalidBody = {
      stoneColorId: 'invalid',
      // Missing required fields
    };

    const request = new NextRequest('http://localhost:3000/api/pricing/quote', {
      method: 'POST',
      body: JSON.stringify(invalidBody),
    });

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.message).toBe('Invalid configuration input');
    expect(data.error.details).toBeDefined();
  });

  it('returns 404 for non-existent stone color', async () => {
    const requestBody = {
      stoneColorId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', // Non-existent CUID
      thicknessId,
      formTypeId,
      edgeTypeId,
      dimensions: {
        formType: 'L',
        leg1: 320,
        leg2: 180,
        depth: 65,
      },
      sinkHoles: 0,
      cooktopHole: false,
      install: false,
      skirtingEnabled: false,
      trimEnabled: false,
    };

    const request = new NextRequest('http://localhost:3000/api/pricing/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(404);
    expect(data.error).toBeDefined();
    expect(data.error.code).toBe('NOT_FOUND');
    expect(data.error.message).toContain('not found');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
