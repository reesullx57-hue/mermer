/**
 * Stones Cache Invalidation Integration Test (F2 Gate 3)
 * Tests that StoneColor mutations invalidate both stones:v1:all and pricing:v1:all
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { computeQuote, invalidateCatalogCache } from './index';
import type { ConfigurationInput } from './schemas';

const prisma = new PrismaClient();

describe('Stones Cache Invalidation (F2 Gate 3)', () => {
  let testStoneColorId: string;
  let testAdminUserId: string;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(async () => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Ensure test admin user exists
    const admin = await prisma.user.upsert({
      where: { email: 'stones-admin@test.local' },
      update: {},
      create: {
        email: 'stones-admin@test.local',
        name: 'Stones Admin',
        passwordHash: 'test-hash',
        role: 'ADMIN',
      },
    });
    testAdminUserId = admin.id;

    // Find a test stone color (e.g., Quartz White 1680)
    const stoneColor = await prisma.stoneColor.findFirst({
      where: {
        m2Price: new Decimal(1680),
        isActive: true,
      },
    });

    if (!stoneColor) {
      throw new Error('Test stone color not found (m2Price 1680)');
    }

    testStoneColorId = stoneColor.id;

    // Ensure m2Price is exactly 1680 before tests
    await prisma.stoneColor.update({
      where: { id: testStoneColorId },
      data: { m2Price: new Decimal(1680) },
    });
  });

  afterAll(async () => {
    // Restore m2Price to 1680
    await prisma.stoneColor.update({
      where: { id: testStoneColorId },
      data: { m2Price: new Decimal(1680) },
    });

    consoleLogSpy.mockRestore();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    consoleLogSpy.mockClear();
  });

  it('invalidates stones:v1:all + pricing:v1:all on StoneColor.m2Price update', async () => {
    // Ensure m2Price is 1680 before test
    await prisma.stoneColor.update({
      where: { id: testStoneColorId },
      data: { m2Price: new Decimal(1680) },
    });

    // 1. Initial quote with m2Price 1680
    const config: ConfigurationInput = {
      stoneColorId: testStoneColorId,
      thicknessId: (await prisma.thickness.findFirst({ where: { cm: 3 } }))!.id,
      formTypeId: (await prisma.formType.findFirst({ where: { code: 'L' } }))!.id,
      edgeTypeId: (await prisma.edgeType.findFirst({ where: { code: 'RADIUS' } }))!.id,
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
    };

    const quote1 = await computeQuote(config);

    // Verify initial basePrice and unitPrice (quote1 is PricingSnapshot directly)
    expect(quote1.basePrice).toBe('1680.00');
    const stoneLine1 = quote1.lines.find((l) => l.code === 'STONE_M2');
    expect(stoneLine1).toBeDefined();
    const unitPrice1 = parseFloat(stoneLine1!.unitPrice);
    // unitPrice = basePrice × coefficients = 1680 × 1.1 × 1.15 × 1.05 = 2231.46
    console.log('quote1 basePrice:', quote1.basePrice);
    console.log('quote1 stone unitPrice:', stoneLine1!.unitPrice);
    expect(unitPrice1).toBeCloseTo(2231.46, 1);

    // 2. Admin updates StoneColor.m2Price to 1800
    await prisma.$transaction(async (tx) => {
      const existing = await tx.stoneColor.findUnique({
        where: { id: testStoneColorId },
      });

      await tx.stoneColor.update({
        where: { id: testStoneColorId },
        data: { m2Price: new Decimal(1800) },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: testAdminUserId,
          action: 'UPDATE',
          entityType: 'StoneColor',
          entityId: testStoneColorId,
          before: {
            m2Price: existing!.m2Price.toString(),
          },
          after: {
            m2Price: '1800',
          },
        },
      });
    });

    // 3. Invalidate cache (ADR-022: stones + pricing)
    await invalidateCatalogCache('stones');

    // Verify tags called
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Cache invalidation requested for tags:',
      expect.arrayContaining(['stones:v1:all', 'pricing:v1:all'])
    );

    // 4. New quote reflects updated m2Price 1800
    const quote2 = await computeQuote(config);

    console.log('quote2 basePrice:', quote2.basePrice);
    const stoneLine2 = quote2.lines.find((l) => l.code === 'STONE_M2');
    expect(stoneLine2).toBeDefined();
    console.log('quote2 stone unitPrice:', stoneLine2!.unitPrice);
    const unitPrice2 = parseFloat(stoneLine2!.unitPrice);
    
    // Verify basePrice updated
    expect(quote2.basePrice).toBe('1800.00');
    // Verify unitPrice changed (should be higher than before)
    expect(unitPrice2).toBeGreaterThan(unitPrice1);
    // Verify the price ratio matches the base price ratio: 1800/1680 = 1.071428...
    const priceRatio = unitPrice2 / unitPrice1;
    expect(priceRatio).toBeCloseTo(1800 / 1680, 2);

    // 5. Verify totals changed
    const stoneLineTotal1 = parseFloat(stoneLine1!.lineTotal);
    const stoneLineTotal2 = parseFloat(stoneLine2!.lineTotal);

    expect(stoneLineTotal2).toBeGreaterThan(stoneLineTotal1);

    console.log('\n[STONES CACHE INVALIDATION TEST]');
    console.log('StoneColor m2Price: 1680 → 1800');
    console.log('Old unitPrice:', stoneLine1!.unitPrice);
    console.log('New unitPrice:', stoneLine2!.unitPrice);
    console.log('Old stone line total:', stoneLine1!.lineTotal);
    console.log('New stone line total:', stoneLine2!.lineTotal);
    console.log('Old totalInclVat:', quote1.totalInclVat);
    console.log('New totalInclVat:', quote2.totalInclVat);
  });

  it('persists old quote snapshot when StoneColor.m2Price changes', async () => {
    // 1. Create quote with current m2Price (1800 from previous test, but we'll ensure 1680 first)
    await prisma.stoneColor.update({
      where: { id: testStoneColorId },
      data: { m2Price: new Decimal(1680) },
    });

    const config: ConfigurationInput = {
      stoneColorId: testStoneColorId,
      thicknessId: (await prisma.thickness.findFirst({ where: { cm: 3 } }))!.id,
      formTypeId: (await prisma.formType.findFirst({ where: { code: 'STRAIGHT' } }))!.id,
      edgeTypeId: (await prisma.edgeType.findFirst({ where: { code: 'STRAIGHT' } }))!.id,
      dimensions: {
        formType: 'STRAIGHT',
        length: 320,
        depth: 65,
      },
      sink: null,
      cooktopHole: false,
      install: false,
      panelled: false,
    };

    const quote = await computeQuote(config);

    // 2. Persist quote with pricingSnapshot (quote is PricingSnapshot directly)
    const minConfig = await prisma.configuration.create({
      data: {
        stoneColorId: testStoneColorId,
        thicknessId: config.thicknessId,
        formTypeId: config.formTypeId,
        edgeTypeId: config.edgeTypeId,
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

    expect(savedQuote.pricingSnapshot).toHaveProperty('basePrice', '1680.00');

    // 3. Update m2Price to 1900
    await prisma.stoneColor.update({
      where: { id: testStoneColorId },
      data: { m2Price: new Decimal(1900) },
    });

    await invalidateCatalogCache('stones');

    // 4. Re-read saved quote → snapshot unchanged
    const reloadedQuote = await prisma.quote.findUnique({
      where: { id: savedQuote.id },
    });

    expect(reloadedQuote!.pricingSnapshot).toHaveProperty('basePrice', '1680.00');

    // 5. New quote uses 1900
    const newQuote = await computeQuote(config);
    expect(newQuote.basePrice).toBe('1900.00');

    console.log('\n[SNAPSHOT IMMUTABILITY TEST]');
    console.log('Old saved snapshot basePrice:', (reloadedQuote!.pricingSnapshot as any).basePrice);
    console.log('New computed quote basePrice:', newQuote.basePrice);

    // Cleanup
    await prisma.quote.delete({ where: { id: savedQuote.id } });
    await prisma.configuration.delete({ where: { id: minConfig.id } });
  });
});
