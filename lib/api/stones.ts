import type {
  StoneBrand,
  StoneColor,
  CreateStoneBrandRequest,
  UpdateStoneBrandRequest,
  CreateStoneColorRequest,
  UpdateStoneColorRequest,
  BrandsResponse,
  BrandResponse,
  ColorsResponse,
  ColorResponse,
  ApiError,
} from '@/lib/types/stone';

export class StonesApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'StonesApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiError | undefined;
    try {
      errorData = await response.json();
    } catch {
      throw new StonesApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        'UNKNOWN_ERROR',
        response.status
      );
    }

    if (errorData?.error) {
      throw new StonesApiError(
        errorData.error.message,
        errorData.error.code,
        response.status
      );
    }

    throw new StonesApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      'UNKNOWN_ERROR',
      response.status
    );
  }

  return response.json();
}

// Stone Brands (PE API)
export async function fetchStoneBrands(includeInactive = false): Promise<StoneBrand[]> {
  const url = includeInactive 
    ? '/api/admin/stone-brands?all=true' 
    : '/api/admin/stone-brands';
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<BrandsResponse>(response);
  return data.brands;
}

export async function fetchStoneBrand(id: string): Promise<StoneBrand> {
  const response = await fetch(`/api/admin/stone-brands/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<BrandResponse>(response);
  return data.brand;
}

export async function createStoneBrand(
  data: CreateStoneBrandRequest
): Promise<StoneBrand> {
  const response = await fetch('/api/admin/stone-brands', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await handleResponse<BrandResponse>(response);
  return result.brand;
}

export async function updateStoneBrand(
  id: string,
  data: UpdateStoneBrandRequest
): Promise<StoneBrand> {
  const response = await fetch(`/api/admin/stone-brands/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await handleResponse<BrandResponse>(response);
  return result.brand;
}

export async function deleteStoneBrand(id: string): Promise<void> {
  const response = await fetch(`/api/admin/stone-brands/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleResponse(response);
  }
}

// Stone Colors (PE API)
export async function fetchStoneColors(stoneId?: string, includeInactive = false): Promise<StoneColor[]> {
  const params = new URLSearchParams();
  if (includeInactive) params.set('all', 'true');
  if (stoneId) params.set('stoneId', stoneId);
  
  const url = `/api/admin/stone-colors${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<ColorsResponse>(response);
  return data.colors;
}

export async function fetchStoneColor(id: string): Promise<StoneColor> {
  const response = await fetch(`/api/admin/stone-colors/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<ColorResponse>(response);
  return data.color;
}

export async function createStoneColor(
  data: CreateStoneColorRequest
): Promise<StoneColor> {
  const response = await fetch('/api/admin/stone-colors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await handleResponse<ColorResponse>(response);
  return result.color;
}

export async function updateStoneColor(
  id: string,
  data: UpdateStoneColorRequest
): Promise<StoneColor> {
  const response = await fetch(`/api/admin/stone-colors/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await handleResponse<ColorResponse>(response);
  return result.color;
}

export async function deleteStoneColor(id: string): Promise<void> {
  const response = await fetch(`/api/admin/stone-colors/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleResponse(response);
  }
}
