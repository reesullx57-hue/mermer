/**
 * Cache invalidation integration tests (F2 Gate 2+)
 * Tests are skipped pending admin CRUD implementation
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { computeQuote, invalidatePricingCache } from './index';
import type { ConfigurationInput } from './schemas';

const prisma = new PrismaClient();

describe('Pricing Cache Invalidation (F2 Gate 2+)', () => {
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

  it.skip('invalidates cache when price rule is updated', async () => {
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

  // Test stub for quote persistence + snapshot immutability
  // Skipped: Quote model requires configurationId (foreign key to Configuration table)
  // which doesn't exist yet. Full implementation in F2 Gate 3.
  //
  // Test plan:
  // 1. Save quote with SINK_HOLE = 300 in pricingSnapshot
  // 2. Update SINK_HOLE rule to 400 + invalidate cache
  // 3. Verify saved quote's pricingSnapshot.lines still contains unitPrice "300.00"
  // 4. Verify new computeQuote() returns unitPrice "400.00"
  // 5. Assert: historical snapshots are immutable; new quotes use current rules

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
