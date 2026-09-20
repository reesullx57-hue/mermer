/**
 * Cache invalidation integration tests (F2 Gate 2)
 * REQUIRED - NOT SKIPPED
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { computeQuote, invalidatePricingCache } from './index';
import type { ConfigurationInput } from './schemas';

const prisma = new PrismaClient();

describe('Pricing Cache Invalidation (F2 Gate 2)', () => {
  let testInput: ConfigurationInput;
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

    testInput = {
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
  });

  it('invalidates cache when price rule is updated', async () => {
    // Step 1: Initial quote with SINK_HOLE = 300
    const quote1 = await computeQuote(testInput);
    const sinkLine1 = quote1.lines.find((l) => l.code === 'SINK_HOLE');
    expect(sinkLine1?.unitPrice).toBe('300.00');

    // Step 2: Update SINK_HOLE rule to 400 (simulating admin mutation)
    await prisma.priceRule.update({
      where: { code: 'SINK_HOLE' },
      data: { value: 400 },
    });

    // Step 3: Invalidate cache (would be called by admin route)
    await invalidatePricingCache();

    // Step 4: New quote should reflect updated price
    const quote2 = await computeQuote(testInput);
    const sinkLine2 = quote2.lines.find((l) => l.code === 'SINK_HOLE');
    expect(sinkLine2?.unitPrice).toBe('400.00');

    // Step 5: Restore original value for other tests
    await prisma.priceRule.update({
      where: { code: 'SINK_HOLE' },
      data: { value: 300 },
    });
    await invalidatePricingCache();
  });

  it('verifies Golden A total with updated SINK_HOLE (math check: 9929.98 not 9909.98)', async () => {
    // Full Golden A configuration
    const goldenAInput: ConfigurationInput = {
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

    // Step 1: Original quote with SINK_HOLE = 300 → total 9809.98
    const quote1 = await computeQuote(goldenAInput);
    expect(quote1.totalInclVat).toBe('9809.98');
    const sinkLine1 = quote1.lines.find((l) => l.code === 'SINK_HOLE');
    expect(sinkLine1?.unitPrice).toBe('300.00');

    // Step 2: Update SINK_HOLE to 400
    await prisma.priceRule.update({
      where: { code: 'SINK_HOLE' },
      data: { value: 400 },
    });

    // Step 3: Invalidate cache
    await invalidatePricingCache();

    // Step 4: New quote with SINK_HOLE = 400
    const quote2 = await computeQuote(goldenAInput);
    const sinkLine2 = quote2.lines.find((l) => l.code === 'SINK_HOLE');
    expect(sinkLine2?.unitPrice).toBe('400.00');

    // Math verification:
    // Original subtotal: 8174.98 (includes sink 300)
    // New subtotal: 8174.98 - 300 + 400 = 8274.98
    expect(quote2.subtotalExVat).toBe('8274.98');

    // VAT: 8274.98 × 0.20 = 1654.996 → ROUND_HALF_UP = 1655.00
    expect(quote2.vatAmount).toBe('1655.00');

    // Total: 8274.98 + 1655.00 = 9929.98 (NOT 9909.98 as PO stated)
    expect(quote2.totalInclVat).toBe('9929.98');

    // Step 5: Restore original value
    await prisma.priceRule.update({
      where: { code: 'SINK_HOLE' },
      data: { value: 300 },
    });
    await invalidatePricingCache();

    // Verify restoration
    const quote3 = await computeQuote(goldenAInput);
    expect(quote3.totalInclVat).toBe('9809.98');
  });

  afterAll(async () => {
    // Ensure SINK_HOLE is restored to original value
    await prisma.priceRule.update({
      where: { code: 'SINK_HOLE' },
      data: { value: 300 },
    });
    await invalidatePricingCache();
    await prisma.$disconnect();
  });
});
