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
      sink: {
        type: 'undermount',
        holes: 1,
      },
      cooktopHole: true,
      install: true,
      skirting: {
        enabled: false,
      },
      trim: {
        enabled: false,
      },
      panelled: false,
      sideBox: {
        enabled: false,
      },
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

    // Verify flat contract structure
    expect(data.currency).toBe('TRY');
    expect(data.warnings).toEqual([]);

    // Verify lines array
    expect(Array.isArray(data.lines)).toBe(true);
    expect(data.lines.length).toBeGreaterThan(0);

    // Verify money totals (Golden A)
    expect(data.subtotalExVat).toBe('8174.98');
    expect(data.dealerDiscount).toBe('0.00');
    expect(data.promoDiscount).toBe('0.00');
    expect(data.vatAmount).toBe('1635.00');
    expect(data.vatRate).toBe('0.2000');
    expect(data.totalInclVat).toBe('9809.98');
    expect(data.total).toBe('9809.98'); // Alias

    // Verify pricing snapshot is included
    expect(data.pricingSnapshot).toBeDefined();
    expect(data.pricingSnapshot.contractVersion).toBe('1.0.0');
    expect(data.pricingSnapshot.totalInclVat).toBe('9809.98');
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
      sink: null,
      cooktopHole: false,
      install: false,
      skirting: {
        enabled: true,
        heightCm: 10,
      },
      trim: {
        enabled: true,
        model: 'standard',
      },
      panelled: false,
      sideBox: {
        enabled: false,
      },
    };

    const request = new NextRequest('http://localhost:3000/api/pricing/quote', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json() as any;

    expect(response.status).toBe(200);

    // Verify flat contract structure
    expect(data.currency).toBe('TRY');
    expect(data.warnings).toEqual([]);

    // Verify money totals (Golden B)
    expect(data.subtotalExVat).toBe('7424.98');
    expect(data.dealerDiscount).toBe('0.00');
    expect(data.promoDiscount).toBe('0.00');
    expect(data.vatAmount).toBe('1485.00');
    expect(data.vatRate).toBe('0.2000');
    expect(data.totalInclVat).toBe('8909.98');
    expect(data.total).toBe('8909.98'); // Alias

    // Verify skirting and trim lines
    const skirtingLine = data.lines.find((l: any) => l.code === 'SKIRTING');
    expect(skirtingLine).toBeDefined();
    expect(skirtingLine.quantity).toBe('3.20');
    expect(skirtingLine.lineTotal).toBe('480.00');

    const trimLine = data.lines.find((l: any) => l.code === 'TRIM');
    expect(trimLine).toBeDefined();
    expect(trimLine.quantity).toBe('3.20');
    expect(trimLine.lineTotal).toBe('320.00');
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
      sink: null,
      cooktopHole: false,
      install: false,
      skirting: {
        enabled: false,
      },
      trim: {
        enabled: false,
      },
      panelled: false,
      sideBox: {
        enabled: false,
      },
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
