export interface TaxConfig {
  id: string;
  taxType: 'VAT_TR';
  vatRate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxConfigWithAudit extends TaxConfig {
  lastUpdater: {
    email: string;
    name: string | null;
    timestamp: string;
  } | null;
}

export interface UpdateTaxConfigRequest {
  vatRate: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
