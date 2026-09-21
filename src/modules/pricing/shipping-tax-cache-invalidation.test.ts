/**
 * Shipping & Tax Cache Invalidation Integration Tests (F2 Gate 5)
 * Tests that ShippingZone and TaxConfig mutations invalidate pricing:v1:*
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { computeQuote, invalidatePricingCache } from './index';
import type { ConfigurationInput } from './schemas';

const prisma = new PrismaClient();

describe('Shipping & Tax Cache Invalidation (F2 Gate 5)', () => {
  let testStoneColorId: string;
  let testThicknessId: string;
  let testFormTypeId: string;
  let testEdgeTypeId: string;
  let testAdminUserId: string;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(async () => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const admin = await prisma.user.upsert({
      where: { email: 'shipping-tax-admin@test.local' },
      update: {},
      create: {
        email: 'shipping-tax-admin@test.local',
        name: 'Shipping Tax Admin',
        passwordHash: 'test-hash',
        role: 'ADMIN',
      },
    });
    testAdminUserId = admin.id;

    const stoneColor = await prisma.stoneColor.findFirst({
      where: { m2Price: new Decimal(1680), isActive: true },
    });
    testStoneColorId = stoneColor!.id;

    testThicknessId = (await prisma.thickness.findFirst({ where: { cm: 3 } }))!.id;
    testFormTypeId = (await prisma.formType.findFirst({ where: { code: 'L' } }))!.id;
    testEdgeTypeId = (await prisma.edgeType.findFirst({ where: { code: 'RADIUS' } }))!.id;
  });

  afterAll(async () => {
    consoleLogSpy.mockRestore();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    consoleLogSpy.mockClear();
  });

  it('invalidates pricing:v1:* on ShippingZone fee update (400 → 500)', async () => {
    // Find İstanbul/Kadıköy zone
    const zone = await prisma.shippingZone.findFirst({
      where: { city: 'İstanbul', district: 'Kadıköy' },
    });

    if (!zone) {
      throw new Error('İstanbul/Kadıköy zone not found');
    }

    // Ensure fee is 400
    await prisma.shippingZone.update({
      where: { id: zone.id },
      data: { fee: new Decimal(400) },
    });

    // 1. Initial quote with shipping fee 400
    const config: ConfigurationInput = {
      stoneColorId: testStoneColorId,
      thicknessId: testThicknessId,
      formTypeId: testFormTypeId,
      edgeTypeId: testEdgeTypeId,
      dimensions: {
        formType: 'L',
        leg1: 320,
        leg2: 180,
        depth: 65,
      },
      sink: null,
      cooktopHole: false,
      install: false,
      panelled: false,
      address: { city: 'İstanbul', district: 'Kadıköy' },
    };

    const quote1 = await computeQuote(config);
    const shippingLine1 = quote1.lines.find((l) => l.code === 'SHIPPING')!;

    expect(shippingLine1).toBeDefined();
    expect(shippingLine1.lineTotal).toBe('400.00');

    // 2. Admin updates fee to 500
    await prisma.$transaction(async (tx) => {
      const existing = await tx.shippingZone.findUnique({
        where: { id: zone.id },
      });

      await tx.shippingZone.update({
        where: { id: zone.id },
        data: { fee: new Decimal(500) },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: testAdminUserId,
          action: 'UPDATE',
          entityType: 'ShippingZone',
          entityId: zone.id,
          before: {
            fee: existing!.fee.toString(),
          },
          after: {
            fee: '500',
          },
        },
      });
    });

    // 3. Invalidate cache
    await invalidatePricingCache();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Cache invalidation requested for tags:',
      expect.arrayContaining(['pricing:v1:shipping', 'pricing:v1:all'])
    );

    // 4. New quote reflects updated fee 500
    const quote2 = await computeQuote(config);
    const shippingLine2 = quote2.lines.find((l) => l.code === 'SHIPPING')!;

    expect(shippingLine2).toBeDefined();
    expect(shippingLine2.lineTotal).toBe('500.00');

    console.log('\n[SHIPPING FEE CACHE INVALIDATION TEST]');
    console.log('Shipping fee: 400 → 500');
    console.log('Old SHIPPING line:', shippingLine1.lineTotal);
    console.log('New SHIPPING line:', shippingLine2.lineTotal);
    console.log('Old totalInclVat:', quote1.totalInclVat);
    console.log('New totalInclVat:', quote2.totalInclVat);

    // Restore
    await prisma.shippingZone.update({
      where: { id: zone.id },
      data: { fee: new Decimal(400) },
    });
  });

  it('persists old quote snapshot when ShippingZone fee changes', async () => {
    const zone = await prisma.shippingZone.findFirst({
      where: { city: 'İstanbul', district: 'Kadıköy' },
    });

    await prisma.shippingZone.update({
      where: { id: zone!.id },
      data: { fee: new Decimal(400) },
    });

    const config: ConfigurationInput = {
      stoneColorId: testStoneColorId,
      thicknessId: testThicknessId,
      formTypeId: testFormTypeId,
      edgeTypeId: testEdgeTypeId,
      dimensions: { formType: 'L', leg1: 320, leg2: 180, depth: 65 },
      sink: null,
      cooktopHole: false,
      install: false,
      panelled: false,
      address: { city: 'İstanbul', district: 'Kadıköy' },
    };

    const quote = await computeQuote(config);

    const minConfig = await prisma.configuration.create({
      data: {
        stoneColorId: testStoneColorId,
        thicknessId: testThicknessId,
        formTypeId: testFormTypeId,
        edgeTypeId: testEdgeTypeId,
        dimensions: config.dimensions,
      },
    });

    const savedQuote = await prisma.quote.create({
      data: {
        configurationId: minConfig.id,
        subtotalExVat: new Decimal(quote.subtotalExVat),
        vatAmount: new Decimal(quote.vatAmount),
        totalInclVat: new Decimal(quote.totalInclVat),
        pricingSnapshot: quote as any,
      },
    });

    const oldShippingLine = (savedQuote.pricingSnapshot as any).lines.find((l: any) => l.code === 'SHIPPING');
    expect(oldShippingLine.lineTotal).toBe('400.00');

    // Update fee to 600
    await prisma.shippingZone.update({
      where: { id: zone!.id },
      data: { fee: new Decimal(600) },
    });

    await invalidatePricingCache();

    // Re-read saved quote → snapshot unchanged
    const reloadedQuote = await prisma.quote.findUnique({
      where: { id: savedQuote.id },
    });

    const reloadedShippingLine = (reloadedQuote!.pricingSnapshot as any).lines.find((l: any) => l.code === 'SHIPPING');
    expect(reloadedShippingLine.lineTotal).toBe('400.00');

    // New quote uses 600
    const newQuote = await computeQuote(config);
    const newShippingLine = newQuote.lines.find((l) => l.code === 'SHIPPING')!;
    expect(newShippingLine.lineTotal).toBe('600.00');

    // Cleanup
    await prisma.quote.delete({ where: { id: savedQuote.id } });
    await prisma.configuration.delete({ where: { id: minConfig.id } });
    await prisma.shippingZone.update({
      where: { id: zone!.id },
      data: { fee: new Decimal(400) },
    });
  });

  it('invalidates pricing:v1:* on TaxConfig vatRate update (0.20 → 0.18)', async () => {
    const taxConfig = await prisma.taxConfig.findUnique({
      where: { code: 'VAT_TR' },
    });

    if (!taxConfig) {
      throw new Error('VAT_TR config not found');
    }

    // Ensure vatRate is 0.20
    await prisma.taxConfig.update({
      where: { code: 'VAT_TR' },
      data: { vatRate: new Decimal(0.20) },
    });

    // 1. Initial quote with VAT 0.20
    const config: ConfigurationInput = {
      stoneColorId: testStoneColorId,
      thicknessId: testThicknessId,
      formTypeId: testFormTypeId,
      edgeTypeId: testEdgeTypeId,
      dimensions: { formType: 'L', leg1: 320, leg2: 180, depth: 65 },
      sink: null,
      cooktopHole: false,
      install: false,
      panelled: false,
    };

    const quote1 = await computeQuote(config);

    expect(quote1.vatRate).toBe('0.2000');
    const vatAmount1 = parseFloat(quote1.vatAmount);

    // 2. Admin updates vatRate to 0.18
    await prisma.$transaction(async (tx) => {
      const existing = await tx.taxConfig.findUnique({
        where: { code: 'VAT_TR' },
      });

      await tx.taxConfig.update({
        where: { code: 'VAT_TR' },
        data: { vatRate: new Decimal(0.18) },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: testAdminUserId,
          action: 'UPDATE',
          entityType: 'TaxConfig',
          entityId: taxConfig.id,
          before: {
            vatRate: existing!.vatRate.toString(),
          },
          after: {
            vatRate: '0.18',
          },
        },
      });
    });

    // 3. Invalidate cache
    await invalidatePricingCache();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Cache invalidation requested for tags:',
      expect.arrayContaining(['pricing:v1:tax', 'pricing:v1:all'])
    );

    // 4. New quote reflects updated VAT 0.18
    const quote2 = await computeQuote(config);

    expect(quote2.vatRate).toBe('0.1800');
    const vatAmount2 = parseFloat(quote2.vatAmount);

    expect(vatAmount2).toBeLessThan(vatAmount1);

    console.log('\n[VAT RATE CACHE INVALIDATION TEST]');
    console.log('VAT rate: 0.20 → 0.18');
    console.log('Old vatRate:', quote1.vatRate);
    console.log('New vatRate:', quote2.vatRate);
    console.log('Old vatAmount:', quote1.vatAmount);
    console.log('New vatAmount:', quote2.vatAmount);
    console.log('Old totalInclVat:', quote1.totalInclVat);
    console.log('New totalInclVat:', quote2.totalInclVat);

    // Restore
    await prisma.taxConfig.update({
      where: { code: 'VAT_TR' },
      data: { vatRate: new Decimal(0.20) },
    });
  });

  it('persists old quote snapshot when TaxConfig vatRate changes', async () => {
    await prisma.taxConfig.update({
      where: { code: 'VAT_TR' },
      data: { vatRate: new Decimal(0.20) },
    });

    const config: ConfigurationInput = {
      stoneColorId: testStoneColorId,
      thicknessId: testThicknessId,
      formTypeId: testFormTypeId,
      edgeTypeId: testEdgeTypeId,
      dimensions: { formType: 'L', leg1: 320, leg2: 180, depth: 65 },
      sink: null,
      cooktopHole: false,
      install: false,
      panelled: false,
    };

    const quote = await computeQuote(config);

    const minConfig = await prisma.configuration.create({
      data: {
        stoneColorId: testStoneColorId,
        thicknessId: testThicknessId,
        formTypeId: testFormTypeId,
        edgeTypeId: testEdgeTypeId,
        dimensions: config.dimensions,
      },
    });

    const savedQuote = await prisma.quote.create({
      data: {
        configurationId: minConfig.id,
        subtotalExVat: new Decimal(quote.subtotalExVat),
        vatAmount: new Decimal(quote.vatAmount),
        totalInclVat: new Decimal(quote.totalInclVat),
        pricingSnapshot: quote as any,
      },
    });

    expect((savedQuote.pricingSnapshot as any).vatRate).toBe('0.2000');

    // Update vatRate to 0.15
    await prisma.taxConfig.update({
      where: { code: 'VAT_TR' },
      data: { vatRate: new Decimal(0.15) },
    });

    await invalidatePricingCache();

    // Re-read saved quote → snapshot unchanged
    const reloadedQuote = await prisma.quote.findUnique({
      where: { id: savedQuote.id },
    });

    expect((reloadedQuote!.pricingSnapshot as any).vatRate).toBe('0.2000');

    // New quote uses 0.15
    const newQuote = await computeQuote(config);
    expect(newQuote.vatRate).toBe('0.1500');

    // Cleanup
    await prisma.quote.delete({ where: { id: savedQuote.id } });
    await prisma.configuration.delete({ where: { id: minConfig.id } });
    await prisma.taxConfig.update({
      where: { code: 'VAT_TR' },
      data: { vatRate: new Decimal(0.20) },
    });
  });
});
