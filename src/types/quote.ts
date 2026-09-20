export type FormType = 'STRAIGHT' | 'L' | 'U' | 'ISLAND';
export type EdgeType = 'straight' | 'radius' | 'bevel' | 'iron';
export type SinkType = 'none' | 'undermount' | 'topmount';

export interface QuoteFormData {
  stoneColorId: string;
  thickness: 2 | 3 | 4;
  formType: FormType;
  edgeType: EdgeType;
  dimensions: {
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
}

export interface QuoteLine {
  code: string;
  label: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
}

export interface QuoteResponse {
  lines: QuoteLine[];
  subtotal: string;
  tax: string;
  total: string;
  wastePercent: number;
  wasteSource: string;
}

export interface QuoteError {
  message: string;
  code?: string;
}
