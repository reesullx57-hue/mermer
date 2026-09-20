/**
 * Pricing module types for contract v1.0.0
 */

export interface PricingSnapshot {
  contractVersion: string;
  stoneColorId: string;
  basePrice: string;
  coefficients: {
    thickness: string;
    formType: string;
    edgeType: string;
  };
  rawDimensions: Record<string, number>;
  computedAreaM2: string;
  wastePercent: string;
  billableAreaM2: string;
  wasteSource: 'global' | 'stone-specific';
  vatRate: string;
  appliedDiscounts: Array<{
    type: 'dealer' | 'promo';
    rate?: string;
    amount: string;
    description: string;
  }>;
  computedAt: string;
  lines: QuoteLine[];
  subtotalExVat: string;
  dealerDiscount: string;
  promoDiscount: string;
  vatAmount: string;
  totalInclVat: string;
}

export interface QuoteLine {
  code: string;
  label: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  sortOrder: number;
}

export interface PricingRules {
  sinkHoleFee: string;
  cooktopHoleFee: string;
  installFee: string;
  wasteDefaultPercent: string;
  minAreaM2: string;
  minOrderAmount: string;
}

export interface TaxConfiguration {
  vatRate: string;
}

export interface ShippingZoneInfo {
  city: string;
  district: string;
  fee: string;
  installAvailable: boolean;
}

export interface CatalogData {
  stoneColor: {
    id: string;
    code: string;
    nameTr: string;
    m2Price: string;
    wastePercent: string | null;
  };
  thickness: {
    id: string;
    cm: number;
    nameTr: string;
    coefficient: string;
  };
  formType: {
    id: string;
    code: string;
    nameTr: string;
    coefficient: string;
  };
  edgeType: {
    id: string;
    code: string;
    nameTr: string;
    coefficient: string;
  };
  dealer?: {
    id: string;
    code: string;
    nameTr: string;
    discountRate: string;
  };
}
