import type {
  PriceRule,
  PriceRuleWithAudit,
  CreatePriceRuleRequest,
  UpdatePriceRuleRequest,
  ApiError,
} from '@/lib/types/pricerule';

class PriceRulesApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'PriceRulesApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiError | undefined;
    try {
      errorData = await response.json();
    } catch {
      throw new PriceRulesApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        'UNKNOWN_ERROR',
        response.status
      );
    }

    if (errorData?.error) {
      throw new PriceRulesApiError(
        errorData.error.message,
        errorData.error.code,
        response.status
      );
    }

    throw new PriceRulesApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      'UNKNOWN_ERROR',
      response.status
    );
  }

  return response.json();
}

export async function fetchPriceRules(): Promise<PriceRuleWithAudit[]> {
  const response = await fetch('/api/admin/pricerules', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<PriceRuleWithAudit[]>(response);
}

export async function createPriceRule(
  data: CreatePriceRuleRequest
): Promise<PriceRuleWithAudit> {
  const response = await fetch('/api/admin/pricerules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<PriceRuleWithAudit>(response);
}

export async function updatePriceRule(
  id: string,
  data: UpdatePriceRuleRequest
): Promise<PriceRuleWithAudit> {
  const response = await fetch(`/api/admin/pricerules/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<PriceRuleWithAudit>(response);
}

export async function deactivatePriceRule(id: string): Promise<PriceRuleWithAudit> {
  const now = new Date().toISOString();
  return updatePriceRule(id, { validTo: now });
}

export { PriceRulesApiError };
