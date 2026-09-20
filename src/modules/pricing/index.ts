/**
 * Pricing module - F1 implementation
 * Contract version: 1.0.0
 */

import Decimal from 'decimal.js';
import { PrismaClient } from '@prisma/client';
import { computeArea, applyWaste } from '../geometry';
import type {
  PricingSnapshot,
  QuoteLine,
  PricingRules,
  TaxConfiguration,
  ShippingZoneInfo,
  CatalogData,
} from './types';
import type { ConfigurationInput } from './schemas';

// Configure Decimal for money operations: round half-up to 2 decimal places
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const prisma = new PrismaClient();

/**
 * Loads pricing rules from database
 */
export async function loadRules(): Promise<PricingRules> {
  const rules = await prisma.priceRule.findMany({
    where: { isActive: true },
  });

  const ruleMap = new Map(rules.map((r) => [r.code, r.value.toString()]));

  return {
    sinkHoleFee: ruleMap.get('SINK_HOLE') || '300',
    cooktopHoleFee: ruleMap.get('COOKTOP_HOLE') || '350',
    installFee: ruleMap.get('INSTALL') || '500',
    wasteDefaultPercent: ruleMap.get('WASTE_DEFAULT_PERCENT') || '0.05',
    minAreaM2: ruleMap.get('MIN_AREA_M2') || '1.0',
    minOrderAmount: ruleMap.get('MIN_ORDER_AMOUNT') || '5000',
  };
}

/**
 * Loads tax configuration from database
 */
export async function loadTaxConfig(): Promise<TaxConfiguration> {
  const taxConfig = await prisma.taxConfig.findFirst({
    where: { code: 'VAT_TR', isActive: true },
  });

  if (!taxConfig) {
    throw new Error('VAT_TR tax configuration not found');
  }

  return {
    vatRate: taxConfig.vatRate.toString(),
  };
}

/**
 * Loads shipping zone info from database
 */
export async function loadShippingZone(
  city: string,
  district: string = ''
): Promise<ShippingZoneInfo | null> {
  // Try exact match first
  let zone = await prisma.shippingZone.findFirst({
    where: {
      city,
      district,
      isActive: true,
    },
  });

  // Fall back to city-wide if district not found
  if (!zone && district !== '') {
    zone = await prisma.shippingZone.findFirst({
      where: {
        city,
        district: '',
        isActive: true,
      },
    });
  }

  if (!zone) return null;

  return {
    city: zone.city,
    district: zone.district,
    fee: zone.fee.toString(),
    installAvailable: zone.installAvailable,
  };
}

/**
 * Loads catalog data (stone, thickness, form, edge, dealer)
 */
export async function loadCatalogData(input: ConfigurationInput): Promise<CatalogData> {
  const [stoneColor, thickness, formType, edgeType, dealer] = await Promise.all([
    prisma.stoneColor.findUnique({
      where: { id: input.stoneColorId },
      include: { stone: true },
    }),
    prisma.thickness.findUnique({
      where: { id: input.thicknessId },
    }),
    prisma.formType.findUnique({
      where: { id: input.formTypeId },
    }),
    prisma.edgeType.findUnique({
      where: { id: input.edgeTypeId },
    }),
    input.dealerId
      ? prisma.dealer.findUnique({
          where: { id: input.dealerId },
        })
      : null,
  ]);

  if (!stoneColor || !stoneColor.isActive) {
    throw new Error(`Stone color not found or inactive: ${input.stoneColorId}`);
  }
  if (!thickness || !thickness.isActive) {
    throw new Error(`Thickness not found or inactive: ${input.thicknessId}`);
  }
  if (!formType || !formType.isActive) {
    throw new Error(`Form type not found or inactive: ${input.formTypeId}`);
  }
  if (!edgeType || !edgeType.isActive) {
    throw new Error(`Edge type not found or inactive: ${input.edgeTypeId}`);
  }
  if (input.dealerId && (!dealer || !dealer.isActive)) {
    throw new Error(`Dealer not found or inactive: ${input.dealerId}`);
  }

  return {
    stoneColor: {
      id: stoneColor.id,
      code: stoneColor.code,
      nameTr: stoneColor.nameTr,
      m2Price: stoneColor.m2Price.toString(),
      wastePercent: stoneColor.wastePercent?.toString() || null,
    },
    thickness: {
      id: thickness.id,
      cm: thickness.cm,
      nameTr: thickness.nameTr,
      coefficient: thickness.coefficient.toString(),
    },
    formType: {
      id: formType.id,
      code: formType.code,
      nameTr: formType.nameTr,
      coefficient: formType.coefficient.toString(),
    },
    edgeType: {
      id: edgeType.id,
      code: edgeType.code,
      nameTr: edgeType.nameTr,
      coefficient: edgeType.coefficient.toString(),
    },
    dealer: dealer
      ? {
          id: dealer.id,
          code: dealer.code,
          nameTr: dealer.nameTr,
          discountRate: dealer.discountRate.toString(),
        }
      : undefined,
  };
}

/**
 * Computes unit price per m²
 * Formula: m2Price × thickness.coefficient × formType.coefficient × edgeType.coefficient
 * Rounded to 2 decimal places with ROUND_HALF_UP
 */
export function computeUnitPrice(
  m2Price: string,
  thicknessCoef: string,
  formTypeCoef: string,
  edgeTypeCoef: string
): string {
  const result = new Decimal(m2Price)
    .mul(thicknessCoef)
    .mul(formTypeCoef)
    .mul(edgeTypeCoef);

  return result.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

/**
 * Computes a complete quote with contract v1.0.0 snapshot
 */
export async function computeQuote(input: ConfigurationInput): Promise<PricingSnapshot> {
  // Load all required data
  const [catalog, rules, taxConfig] = await Promise.all([
    loadCatalogData(input),
    loadRules(),
    loadTaxConfig(),
  ]);

  // Compute geometry
  const computedAreaM2 = computeArea(
    input.dimensions.formType,
    input.dimensions as any
  );

  // Determine waste percentage: stone-specific or global default
  const wastePercent = catalog.stoneColor.wastePercent
    ? parseFloat(catalog.stoneColor.wastePercent)
    : parseFloat(rules.wasteDefaultPercent);
  
  const wasteSource = catalog.stoneColor.wastePercent ? 'stone-specific' : 'global';

  // Apply waste to get billable area
  const billableAreaM2 = applyWaste(computedAreaM2, wastePercent);

  // Compute unit price
  const unitPrice = computeUnitPrice(
    catalog.stoneColor.m2Price,
    catalog.thickness.coefficient,
    catalog.formType.coefficient,
    catalog.edgeType.coefficient
  );

  // Build quote lines
  const lines: QuoteLine[] = [];
  let sortOrder = 0;

  // Main stone line
  const stoneLineTotal = new Decimal(unitPrice)
    .mul(billableAreaM2)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  lines.push({
    code: 'STONE_M2',
    label: `${catalog.stoneColor.nameTr} - ${catalog.thickness.nameTr}`,
    unit: 'M2',
    quantity: billableAreaM2.toFixed(4),
    unitPrice: unitPrice,
    lineTotal: stoneLineTotal.toFixed(2),
    sortOrder: sortOrder++,
  });

  // Sink holes
  if (input.sinkHoles > 0) {
    const sinkTotal = new Decimal(rules.sinkHoleFee)
      .mul(input.sinkHoles)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    lines.push({
      code: 'SINK_HOLE',
      label: 'Eviye Deliği',
      unit: 'ADET',
      quantity: input.sinkHoles.toString(),
      unitPrice: new Decimal(rules.sinkHoleFee).toFixed(2),
      lineTotal: sinkTotal.toFixed(2),
      sortOrder: sortOrder++,
    });
  }

  // Cooktop hole
  if (input.cooktopHole) {
    lines.push({
      code: 'COOKTOP_HOLE',
      label: 'Ocak Deliği',
      unit: 'ADET',
      quantity: '1',
      unitPrice: new Decimal(rules.cooktopHoleFee).toFixed(2),
      lineTotal: new Decimal(rules.cooktopHoleFee).toFixed(2),
      sortOrder: sortOrder++,
    });
  }

  // Installation
  if (input.install) {
    lines.push({
      code: 'INSTALL',
      label: 'Montaj',
      unit: 'HIZMET',
      quantity: '1',
      unitPrice: new Decimal(rules.installFee).toFixed(2),
      lineTotal: new Decimal(rules.installFee).toFixed(2),
      sortOrder: sortOrder++,
    });
  }

  // Shipping
  if (input.address) {
    const shippingZone = await loadShippingZone(
      input.address.city,
      input.address.district || ''
    );

    if (shippingZone) {
      lines.push({
        code: 'SHIPPING',
        label: `Sevkiyat - ${shippingZone.city}${shippingZone.district ? '/' + shippingZone.district : ''}`,
        unit: 'HIZMET',
        quantity: '1',
        unitPrice: new Decimal(shippingZone.fee).toFixed(2),
        lineTotal: new Decimal(shippingZone.fee).toFixed(2),
        sortOrder: sortOrder++,
      });
    }
  }

  // Calculate subtotal (ex-VAT)
  const subtotalExVat = lines.reduce(
    (sum, line) => sum.add(line.lineTotal),
    new Decimal(0)
  );

  // Apply dealer discount
  let dealerDiscount = new Decimal(0);
  const appliedDiscounts: PricingSnapshot['appliedDiscounts'] = [];

  if (catalog.dealer) {
    dealerDiscount = subtotalExVat
      .mul(catalog.dealer.discountRate)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    appliedDiscounts.push({
      type: 'dealer',
      rate: catalog.dealer.discountRate,
      amount: dealerDiscount.toFixed(2),
      description: `Bayi İndirimi - ${catalog.dealer.nameTr}`,
    });
  }

  // Promo discount (not implemented in F1)
  const promoDiscount = new Decimal(0);

  // Calculate VAT
  const taxableAmount = subtotalExVat.sub(dealerDiscount).sub(promoDiscount);
  const vatAmount = taxableAmount
    .mul(taxConfig.vatRate)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // Total including VAT
  const totalInclVat = taxableAmount.add(vatAmount);

  // Extract raw dimensions as simple key-value pairs
  const rawDimensions: Record<string, number> = {};
  Object.entries(input.dimensions).forEach(([key, value]) => {
    if (typeof value === 'number') {
      rawDimensions[key] = value;
    }
  });

  // Build pricing snapshot with consistent decimal formatting
  const snapshot: PricingSnapshot = {
    contractVersion: '1.0.0',
    stoneColorId: catalog.stoneColor.id,
    basePrice: new Decimal(catalog.stoneColor.m2Price).toFixed(2),
    coefficients: {
      thickness: new Decimal(catalog.thickness.coefficient).toFixed(2),
      formType: new Decimal(catalog.formType.coefficient).toFixed(2),
      edgeType: new Decimal(catalog.edgeType.coefficient).toFixed(2),
    },
    rawDimensions,
    computedAreaM2: computedAreaM2.toFixed(4),
    wastePercent: wastePercent.toFixed(4),
    billableAreaM2: billableAreaM2.toFixed(4),
    wasteSource,
    vatRate: new Decimal(taxConfig.vatRate).toFixed(4),
    appliedDiscounts,
    computedAt: new Date().toISOString(),
    lines,
    subtotalExVat: subtotalExVat.toFixed(2),
    dealerDiscount: dealerDiscount.toFixed(2),
    promoDiscount: promoDiscount.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    totalInclVat: totalInclVat.toFixed(2),
  };

  return snapshot;
}

/**
 * Invalidates pricing cache tags
 * Used when pricing rules, tax config, or catalog items are updated
 */
export function invalidatePricingCache(tags: string[] = ['pricing:v1:all']): void {
  // Cache invalidation logic would be implemented here
  // For now, this is a placeholder for future Next.js cache integration
  console.log('Cache invalidation requested for tags:', tags);
}

/**
 * Helper to invalidate all pricing-related cache
 */
export function invalidateAllPricingCache(): void {
  invalidatePricingCache([
    'pricing:v1:all',
    'pricing:v1:rules',
    'pricing:v1:tax',
    'pricing:v1:discounts',
    'pricing:v1:shipping',
  ]);
}
