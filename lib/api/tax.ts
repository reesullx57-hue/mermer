import type {
  TaxConfigWithAudit,
  UpdateTaxConfigRequest,
  ApiError,
} from '@/lib/types/tax';

class TaxApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'TaxApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiError | undefined;
    try {
      errorData = await response.json();
    } catch {
      throw new TaxApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        'UNKNOWN_ERROR',
        response.status
      );
    }

    if (errorData?.error) {
      throw new TaxApiError(
        errorData.error.message,
        errorData.error.code,
        response.status
      );
    }

    throw new TaxApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      'UNKNOWN_ERROR',
      response.status
    );
  }

  return response.json();
}

export async function fetchTaxConfig(): Promise<TaxConfigWithAudit> {
  const response = await fetch('/api/admin/tax-configs', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<{ configs: TaxConfigWithAudit[] }>(response);
  const vatTr = data.configs.find((c) => c.code === 'VAT_TR');
  
  if (!vatTr) {
    throw new TaxApiError('VAT_TR config not found', 'NOT_FOUND', 404);
  }
  
  return vatTr;
}

export async function updateTaxConfig(
  data: UpdateTaxConfigRequest
): Promise<TaxConfigWithAudit> {
  const payload = {
    vatRate: parseFloat(data.vatRate),
  };

  const response = await fetch('/api/admin/tax-configs?code=VAT_TR', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<{ config: TaxConfigWithAudit }>(response);
  return result.config;
}

export { TaxApiError };
