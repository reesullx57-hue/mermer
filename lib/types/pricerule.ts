export type PriceRuleCode =
  | 'SINK_HOLE'
  | 'COOKTOP_HOLE'
  | 'INSTALL'
  | 'WASTE_DEFAULT_PERCENT'
  | 'MIN_AREA_M2'
  | 'MIN_ORDER_AMOUNT';

export interface PriceRule {
  id: string;
  code: PriceRuleCode;
  version: number;
  validFrom: string;
  validTo: string | null;
  value: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface CreatePriceRuleRequest {
  code: PriceRuleCode;
  validFrom: string;
  validTo?: string | null;
  value: string;
}

export interface UpdatePriceRuleRequest {
  validFrom?: string;
  validTo?: string | null;
  value?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
