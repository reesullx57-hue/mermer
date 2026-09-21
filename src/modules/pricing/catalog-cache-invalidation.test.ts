/**
 * Catalog Cache Invalidation Integration Test (F2 Gate 4)
 * Tests that catalog coefficient mutations invalidate pricing:v1:* tags
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { computeQuote, invalidatePricingCache } from './index';
import type { ConfigurationInput } from './schemas';

const prisma = new PrismaClient();

describe('Catalog Coefficient Cache Invalidation (F2 Gate 4)', () => {
  let testStoneColorId: string;
  let testThicknessId: string;
  let testFormTypeId: string;
  let testEdgeTypeId: string;
  let testAdminUserId: string;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(async () => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Ensure test admin user exists
    const admin = await prisma.user.upsert({
      where: { email: 'catalog-admin@test.local' },
      update: {},
      create: {
        email: 'catalog-admin@test.local',
        name: 'Catalog Admin',
        passwordHash: 'test-hash',
        role: 'ADMIN',
      },
    });
    testAdminUserId = admin.id;

    // Find test entities
    const stoneColor = await prisma.stoneColor.findFirst({
      where: { m2Price: new Decimal(1680), isActive: true },
    });
    testStoneColorId = stoneColor!.id;

    const thickness = await prisma.thickness.findFirst({ where: { cm: 3 } });
    testThicknessId = thickness!.id;

    const formType = await prisma.formType.findFirst({ where: { code: 'L' } });
    testFormTypeId = formType!.id;

    const edgeType = await prisma.edgeType.findFirst({ where: { code: 'RADIUS' } });
    testEdgeTypeId = edgeType!.id;

    // Ensure thickness coefficient is 1.10
    await prisma.thickness.update({
      where: { id: testThicknessId },
      data: { coefficient: new Decimal(1.10) },
    });
  });

  afterAll(async () => {
    // Restore thickness coefficient to 1.10
    await prisma.thickness.update({
      where: { id: testThicknessId },
      data: { coefficient: new Decimal(1.10) },
    });

    consoleLogSpy.mockRestore();
    await prisma.$disconnect();
  });

  beforeEach(() => {
    consoleLogSpy.mockClear();
  });

  it('invalidates pricing:v1:* tags on Thickness coefficient update (1.10 → 1.20)', async () => {
    // 1. Initial quote with thickness coefficient 1.10
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
    };

    const quote1 = await computeQuote(config);
    const stoneLine1 = quote1.lines.find((l) => l.code === 'STONE_M2')!;

    // Verify initial unitPrice: 1680 × 1.10 × 1.15 × 1.05 = 2231.46
    expect(quote1.basePrice).toBe('1680.00');
    expect(quote1.coefficients.thickness).toBe('1.10');
    expect(stoneLine1.unitPrice).toBe('2231.46');

    // 2. Admin updates Thickness coefficient to 1.20
    await prisma.$transaction(async (tx) => {
      const existing = await tx.thickness.findUnique({
        where: { id: testThicknessId },
      });

      await tx.thickness.update({
        where: { id: testThicknessId },
        data: { coefficient: new Decimal(1.20) },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: testAdminUserId,
          action: 'UPDATE',
          entityType: 'Thickness',
          entityId: testThicknessId,
          before: {
            coefficient: existing!.coefficient.toString(),
          },
          after: {
            coefficient: '1.20',
          },
        },
      });
    });

    // 3. Invalidate cache (pricing:v1:*)
    await invalidatePricingCache();

    // Verify tags called
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Cache invalidation requested for tags:',
      expect.arrayContaining([
        'pricing:v1:all',
        'pricing:v1:rules',
        'pricing:v1:tax',
        'pricing:v1:shipping',
      ])
    );

    // 4. New quote reflects updated coefficient 1.20
    const quote2 = await computeQuote(config);
    const stoneLine2 = quote2.lines.find((l) => l.code === 'STONE_M2')!;

    expect(quote2.basePrice).toBe('1680.00');
    expect(quote2.coefficients.thickness).toBe('1.20');
    // unitPrice = 1680 × 1.20 × 1.15 × 1.05 = 2434.32
    expect(stoneLine2.unitPrice).toBe('2434.32');

    // 5. Verify unitPrice changed correctly
    const unitPrice1 = parseFloat(stoneLine1.unitPrice);
    const unitPrice2 = parseFloat(stoneLine2.unitPrice);
    expect(unitPrice2).toBeGreaterThan(unitPrice1);
    expect(unitPrice2 / unitPrice1).toBeCloseTo(1.20 / 1.10, 2);

    console.log('\n[CATALOG COEFFICIENT CACHE INVALIDATION TEST]');
    console.log('Thickness coefficient: 1.10 → 1.20');
    console.log('Old unitPrice:', stoneLine1.unitPrice);
    console.log('New unitPrice:', stoneLine2.unitPrice);
    console.log('Old STONE_M2 total:', stoneLine1.lineTotal);
    console.log('New STONE_M2 total:', stoneLine2.lineTotal);
    console.log('Old totalInclVat:', quote1.totalInclVat);
    console.log('New totalInclVat:', quote2.totalInclVat);
  });

  it('persists old quote snapshot when Thickness coefficient changes', async () => {
    // Ensure coefficient is 1.10
    await prisma.thickness.update({
      where: { id: testThicknessId },
      data: { coefficient: new Decimal(1.10) },
    });

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
    };

    const quote = await computeQuote(config);

    // Persist quote with pricingSnapshot
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

    expect(savedQuote.pricingSnapshot).toHaveProperty('coefficients');
    expect((savedQuote.pricingSnapshot as any).coefficients.thickness).toBe('1.10');

    // Update coefficient to 1.25
    await prisma.thickness.update({
      where: { id: testThicknessId },
      data: { coefficient: new Decimal(1.25) },
    });

    await invalidatePricingCache();

    // Re-read saved quote → snapshot unchanged
    const reloadedQuote = await prisma.quote.findUnique({
      where: { id: savedQuote.id },
    });

    expect((reloadedQuote!.pricingSnapshot as any).coefficients.thickness).toBe('1.10');

    // New quote uses 1.25
    const newQuote = await computeQuote(config);
    expect(newQuote.coefficients.thickness).toBe('1.25');

    console.log('\n[SNAPSHOT IMMUTABILITY TEST - CATALOG]');
    console.log('Old saved snapshot thickness:', (reloadedQuote!.pricingSnapshot as any).coefficients.thickness);
    console.log('New computed quote thickness:', newQuote.coefficients.thickness);

    // Cleanup
    await prisma.quote.delete({ where: { id: savedQuote.id } });
    await prisma.configuration.delete({ where: { id: minConfig.id } });
  });
});
