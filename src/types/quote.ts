export type FormType = 'STRAIGHT' | 'L' | 'U' | 'ISLAND';
export type EdgeType = 'straight' | 'radius' | 'bevel' | 'iron';
export type SinkType = 'none' | 'undermount' | 'topmount';

export interface QuoteFormData {
  stoneColorId: string;
  thicknessId: string;
  formTypeId: string;
  edgeTypeId: string;
  dimensions: {
    formType: FormType;
    length?: number;
    depth?: number;
    leg1?: number;
    leg2?: number;
    leg3?: number;
  };
  sink: {
    type: SinkType;
    holes: number;
  };
  cooktopHole: boolean;
  skirting: {
    enabled: boolean;
    heightCm?: number;
  };
  trim: {
    enabled: boolean;
    model?: string;
  };
  sideBox: {
    enabled: boolean;
    sizeCm?: number;
  };
  panelled: boolean;
  install: boolean;
  address: {
    city: string;
    district: string;
  };
  dealerId?: string | null;
}

export interface QuoteLine {
  code: string;
  label: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  sortOrder?: number;
}

export interface QuoteResponse {
  currency: string;
  lines: QuoteLine[];
  subtotalExVat: string;
  dealerDiscount: string;
  promoDiscount: string;
  vatAmount: string;
  vatRate: string;
  totalInclVat: string;
  total: string;
  pricingSnapshot: any;
  warnings: string[];
}

export interface QuoteError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
