/**
 * Unit tests for pricing module
 * Tests contract v1.0.0 snapshot shape and golden test cases
 */

import Decimal from 'decimal.js';
import { computeUnitPrice, computeQuote, loadRules, loadTaxConfig } from './index';
import type { ConfigurationInput } from './schemas';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Pricing Module - Contract v1.0.0', () => {
  describe('computeUnitPrice', () => {
    it('calculates unit price with all four coefficients', () => {
      // Base price 1000, all coefficients 1.0
      const result = computeUnitPrice('1000.00', '1.00', '1.00', '1.00');
      expect(result).toBe('1000.00');
    });

    it('applies thickness coefficient', () => {
      // Base 1000, thickness 1.10
      const result = computeUnitPrice('1000.00', '1.10', '1.00', '1.00');
      expect(result).toBe('1100.00');
    });

    it('applies all coefficients in sequence', () => {
      // Base 1000, thickness 1.10, form 1.15, edge 1.05
      // 1000 × 1.10 × 1.15 × 1.05 = 1328.25
      const result = computeUnitPrice('1000.00', '1.10', '1.15', '1.05');
      expect(result).toBe('1328.25');
    });

    it('L golden: quartz white 1680 + thickness 3cm (1.10) + L (1.15) + radius (1.05)', async () => {
      // Seed data: quartz white = 1680, thickness 3cm = 1.10, L = 1.15, radius = 1.05
      // Expected: 1680 × 1.10 × 1.15 × 1.05 = 2231.46
      const result = computeUnitPrice('1680.00', '1.10', '1.15', '1.05');
      expect(result).toBe('2231.46');
    });

    it('rounds correctly using ROUND_HALF_UP to 2 decimals', () => {
      // 1680.00 × 1.101 × 1.151 × 1.051 = 2237.5597...
      const result = computeUnitPrice('1680.00', '1.101', '1.151', '1.051');
      expect(result).toBe('2237.56');
    });
  });

  describe('loadRules', () => {
    it('loads pricing rules from database', async () => {
      const rules = await loadRules();

      expect(rules).toHaveProperty('sinkHoleFee');
      expect(rules).toHaveProperty('cooktopHoleFee');
      expect(rules).toHaveProperty('installFee');
      expect(rules).toHaveProperty('wasteDefaultPercent');
      expect(rules).toHaveProperty('minAreaM2');
      expect(rules).toHaveProperty('minOrderAmount');

      // Check seed values
      expect(rules.sinkHoleFee).toBe('300');
      expect(rules.cooktopHoleFee).toBe('350');
      expect(rules.installFee).toBe('500');
      expect(rules.wasteDefaultPercent).toBe('0.05');
    });
  });

  describe('loadTaxConfig', () => {
    it('loads VAT rate from database', async () => {
      const taxConfig = await loadTaxConfig();

      expect(taxConfig).toHaveProperty('vatRate');
      expect(taxConfig.vatRate).toBe('0.2'); // 20% from seed
    });
  });

  describe('computeQuote - Snapshot Shape', () => {
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
        throw new Error('Seed data not found - run npm run db:seed first');
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
    });

    it('returns snapshot with contract v1.0.0 structure and exact formatting', async () => {
      const snapshot = await computeQuote(testInput);

      // Contract version
      expect(snapshot.contractVersion).toBe('1.0.0');

      // Stone info with exact 2 decimal formatting
      expect(snapshot.stoneColorId).toBe(stoneColorId);
      expect(snapshot.basePrice).toBe('1680.00');

      // Coefficients with exact 2 decimal formatting
      expect(snapshot.coefficients).toEqual({
        thickness: '1.10',
        formType: '1.15',
        edgeType: '1.05',
      });

      // Geometry with exact 4 decimal formatting
      expect(snapshot.rawDimensions).toEqual({
        leg1: 320,
        leg2: 180,
        depth: 65,
      });
      expect(snapshot.computedAreaM2).toBe('2.8275');
      expect(snapshot.wastePercent).toBe('0.0500');
      expect(snapshot.billableAreaM2).toBe('2.9689');
      expect(snapshot.wasteSource).toBe('global');

      // Tax with exact 4 decimal formatting
      expect(snapshot.vatRate).toBe('0.2000');

      // Discounts - always present (empty array when no dealer)
      expect(Array.isArray(snapshot.appliedDiscounts)).toBe(true);
      expect(snapshot.appliedDiscounts).toEqual([]);
      expect(snapshot.dealerDiscount).toBe('0.00');
      expect(snapshot.promoDiscount).toBe('0.00');

      // Timestamp - always present
      expect(snapshot.computedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(snapshot.computedAt).toMatch(/Z$/);

      // Lines - verify formatting
      expect(Array.isArray(snapshot.lines)).toBe(true);
      expect(snapshot.lines.length).toBeGreaterThan(0);
      
      // Check stone line has correct formatting
      const stoneLine = snapshot.lines.find(l => l.code === 'STONE_M2');
      expect(stoneLine).toBeDefined();
      expect(stoneLine!.unitPrice).toMatch(/^\d+\.\d{2}$/);
      expect(stoneLine!.lineTotal).toMatch(/^\d+\.\d{2}$/);
      expect(stoneLine!.quantity).toMatch(/^\d+\.\d{4}$/);

      // Totals with exact 2 decimal formatting
      expect(snapshot.subtotalExVat).toMatch(/^\d+\.\d{2}$/);
      expect(snapshot.vatAmount).toMatch(/^\d+\.\d{2}$/);
      expect(snapshot.totalInclVat).toMatch(/^\d+\.\d{2}$/);
    });

    it('Golden A: L form with services, no dealer → 9809.98 TRY', async () => {
      const snapshot = await computeQuote(testInput);

      // Find stone line
      const stoneLine = snapshot.lines.find((line) => line.code === 'STONE_M2');
      expect(stoneLine).toBeDefined();

      // Check unit price: 1680 × 1.10 × 1.15 × 1.05 = 2231.46
      expect(stoneLine!.unitPrice).toBe('2231.46');

      // Check quantity (billable area)
      expect(stoneLine!.quantity).toBe('2.9689');

      // Check line total: 2231.46 × 2.9689 = 6624.98
      expect(stoneLine!.lineTotal).toBe('6624.98');

      // Verify service lines
      expect(snapshot.lines.find(l => l.code === 'SINK_HOLE')).toBeDefined();
      expect(snapshot.lines.find(l => l.code === 'COOKTOP_HOLE')).toBeDefined();
      expect(snapshot.lines.find(l => l.code === 'INSTALL')).toBeDefined();
      expect(snapshot.lines.find(l => l.code === 'SHIPPING')).toBeDefined();

      // Verify totals
      expect(snapshot.subtotalExVat).toBe('8174.98');
      expect(snapshot.vatAmount).toBe('1635.00');
      expect(snapshot.totalInclVat).toBe('9809.98');
      expect(snapshot.appliedDiscounts).toEqual([]);
    });

    it('Golden B: L form with skirting+trim, no services, no dealer → 8909.98 TRY', async () => {
      const goldenBInput: ConfigurationInput = {
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
        // No address = no shipping
        // No dealerId = no dealer discount
      };

      const snapshot = await computeQuote(goldenBInput);

      // Stone line
      const stoneLine = snapshot.lines.find((line) => line.code === 'STONE_M2');
      expect(stoneLine).toBeDefined();
      expect(stoneLine!.unitPrice).toBe('2231.46');
      expect(stoneLine!.quantity).toBe('2.9689');
      expect(stoneLine!.lineTotal).toBe('6624.98');

      // Skirting line: 3.20 meters × 150.00 = 480.00
      const skirtingLine = snapshot.lines.find((line) => line.code === 'SKIRTING');
      expect(skirtingLine).toBeDefined();
      expect(skirtingLine!.quantity).toBe('3.20'); // leg1 320cm / 100 = 3.20m
      expect(skirtingLine!.unitPrice).toBe('150.00');
      expect(skirtingLine!.lineTotal).toBe('480.00');

      // Trim line: 3.20 meters × 100.00 = 320.00
      const trimLine = snapshot.lines.find((line) => line.code === 'TRIM');
      expect(trimLine).toBeDefined();
      expect(trimLine!.quantity).toBe('3.20'); // leg1 320cm / 100 = 3.20m
      expect(trimLine!.unitPrice).toBe('100.00');
      expect(trimLine!.lineTotal).toBe('320.00');

      // No service lines
      expect(snapshot.lines.find(l => l.code === 'SINK_HOLE')).toBeUndefined();
      expect(snapshot.lines.find(l => l.code === 'COOKTOP_HOLE')).toBeUndefined();
      expect(snapshot.lines.find(l => l.code === 'INSTALL')).toBeUndefined();
      expect(snapshot.lines.find(l => l.code === 'SHIPPING')).toBeUndefined();

      // Verify totals: 6624.98 + 480.00 + 320.00 = 7424.98
      expect(snapshot.subtotalExVat).toBe('7424.98');
      // VAT: 7424.98 × 0.20 = 1484.996 → ROUND_HALF_UP = 1485.00
      expect(snapshot.vatAmount).toBe('1485.00');
      // Total: 7424.98 + 1485.00 = 8909.98
      expect(snapshot.totalInclVat).toBe('8909.98');
      expect(snapshot.appliedDiscounts).toEqual([]);
    });

    it('includes all requested service lines with correct formatting', async () => {
      const snapshot = await computeQuote(testInput);

      const lineCodes = snapshot.lines.map((line) => line.code);

      expect(lineCodes).toContain('STONE_M2');
      expect(lineCodes).toContain('SINK_HOLE');
      expect(lineCodes).toContain('COOKTOP_HOLE');
      expect(lineCodes).toContain('INSTALL');
      expect(lineCodes).toContain('SHIPPING');

      // Verify all lines have correct money formatting (2 decimals)
      snapshot.lines.forEach((line) => {
        expect(line.unitPrice).toMatch(/^\d+\.\d{2}$/);
        expect(line.lineTotal).toMatch(/^\d+\.\d{2}$/);
      });
    });

    it('calculates subtotal correctly', async () => {
      const snapshot = await computeQuote(testInput);

      // Sum all line totals
      const expectedSubtotal = snapshot.lines.reduce(
        (sum, line) => sum.add(line.lineTotal),
        new Decimal(0)
      );

      expect(snapshot.subtotalExVat).toBe(expectedSubtotal.toFixed(2));
    });

    it('calculates VAT correctly (20%)', async () => {
      const snapshot = await computeQuote(testInput);

      const subtotal = new Decimal(snapshot.subtotalExVat);
      const dealerDisc = new Decimal(snapshot.dealerDiscount);
      const promoDisc = new Decimal(snapshot.promoDiscount);

      const taxableAmount = subtotal.sub(dealerDisc).sub(promoDisc);
      const expectedVat = taxableAmount.mul('0.2').toDecimalPlaces(2);

      expect(snapshot.vatAmount).toBe(expectedVat.toFixed(2));
    });

    it('calculates total including VAT correctly', async () => {
      const snapshot = await computeQuote(testInput);

      const subtotal = new Decimal(snapshot.subtotalExVat);
      const dealerDisc = new Decimal(snapshot.dealerDiscount);
      const promoDisc = new Decimal(snapshot.promoDiscount);
      const vat = new Decimal(snapshot.vatAmount);

      const expectedTotal = subtotal.sub(dealerDisc).sub(promoDisc).add(vat);

      expect(snapshot.totalInclVat).toBe(expectedTotal.toFixed(2));
    });

    it('includes dealer discount when dealerId provided with correct formatting', async () => {
      // Find a dealer
      const dealer = await prisma.dealer.findFirst({
        where: { code: 'DLR-001' },
      });

      if (!dealer) {
        throw new Error('Dealer DLR-001 not found in seed data');
      }

      const inputWithDealer: ConfigurationInput = {
        ...testInput,
        skirtingEnabled: false,
        trimEnabled: false,
        dealerId: dealer.id,
      };

      const snapshot = await computeQuote(inputWithDealer);

      // Should have dealer discount with correct formatting
      expect(snapshot.appliedDiscounts.length).toBe(1);
      expect(snapshot.appliedDiscounts[0].type).toBe('dealer');
      expect(snapshot.appliedDiscounts[0].rate).toBe('0.1');
      expect(snapshot.appliedDiscounts[0].amount).toMatch(/^\d+\.\d{2}$/);

      // Discount should be 10% of subtotal with 2 decimal formatting
      const expectedDiscount = new Decimal(snapshot.subtotalExVat)
        .mul('0.1')
        .toDecimalPlaces(2);

      expect(snapshot.dealerDiscount).toBe(expectedDiscount.toFixed(2));
    });

    it('handles STRAIGHT form correctly', async () => {
      const straightInput: ConfigurationInput = {
        stoneColorId,
        thicknessId,
        formTypeId: (
          await prisma.formType.findFirst({ where: { code: 'STRAIGHT' } })
        )!.id,
        edgeTypeId,
        dimensions: {
          formType: 'STRAIGHT',
          length: 320,
          depth: 65,
        },
        sinkHoles: 0,
        cooktopHole: false,
        install: false,
        skirtingEnabled: false,
        trimEnabled: false,
      };

      const snapshot = await computeQuote(straightInput);

      expect(snapshot.computedAreaM2).toBe('2.0800');
      expect(snapshot.billableAreaM2).toBe('2.1840');
    });

    it('handles U form correctly', async () => {
      const uInput: ConfigurationInput = {
        stoneColorId,
        thicknessId,
        formTypeId: (await prisma.formType.findFirst({ where: { code: 'U' } }))!
          .id,
        edgeTypeId,
        dimensions: {
          formType: 'U',
          leg1: 320,
          leg2: 180,
          leg3: 200,
          depth: 65,
        },
        sinkHoles: 0,
        cooktopHole: false,
        install: false,
        skirtingEnabled: false,
        trimEnabled: false,
      };

      const snapshot = await computeQuote(uInput);

      expect(snapshot.computedAreaM2).toBe('3.7050');
      expect(snapshot.billableAreaM2).toBe('3.8903');
    });

    it('handles ISLAND form correctly', async () => {
      const islandInput: ConfigurationInput = {
        stoneColorId,
        thicknessId,
        formTypeId: (
          await prisma.formType.findFirst({ where: { code: 'ISLAND' } })
        )!.id,
        edgeTypeId,
        dimensions: {
          formType: 'ISLAND',
          length: 320,
          depth: 65,
        },
        sinkHoles: 0,
        cooktopHole: false,
        install: false,
        skirtingEnabled: false,
        trimEnabled: false,
      };

      const snapshot = await computeQuote(islandInput);

      expect(snapshot.computedAreaM2).toBe('2.0800');
      expect(snapshot.billableAreaM2).toBe('2.1840');
    });

    it('handles district-specific shipping with correct formatting', async () => {
      const snapshot = await computeQuote(testInput);

      const shippingLine = snapshot.lines.find((line) => line.code === 'SHIPPING');
      expect(shippingLine).toBeDefined();
      expect(shippingLine!.label).toContain('İstanbul/Kadıköy');
      expect(shippingLine!.lineTotal).toBe('400.00'); // Kadıköy specific rate with 2 decimals
      expect(shippingLine!.unitPrice).toBe('400.00');
    });

    it('handles city-wide shipping fallback with correct formatting', async () => {
      const inputCityWide: ConfigurationInput = {
        ...testInput,
        skirtingEnabled: false,
        trimEnabled: false,
        address: {
          city: 'Ankara',
          district: '',
        },
      };

      const snapshot = await computeQuote(inputCityWide);

      const shippingLine = snapshot.lines.find((line) => line.code === 'SHIPPING');
      expect(shippingLine).toBeDefined();
      expect(shippingLine!.lineTotal).toBe('500.00'); // Ankara city-wide rate with 2 decimals
      expect(shippingLine!.unitPrice).toBe('500.00');
    });

    it('omits shipping when no address provided', async () => {
      const inputNoShipping: ConfigurationInput = {
        ...testInput,
        skirtingEnabled: false,
        trimEnabled: false,
        address: undefined,
      };

      const snapshot = await computeQuote(inputNoShipping);

      const shippingLine = snapshot.lines.find((line) => line.code === 'SHIPPING');
      expect(shippingLine).toBeUndefined();
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
