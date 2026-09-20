import type {
  StoneBrand,
  StoneCollection,
  Stone,
  StoneColor,
  CreateStoneBrandRequest,
  UpdateStoneBrandRequest,
  CreateStoneCollectionRequest,
  CreateStoneRequest,
  CreateStoneColorRequest,
  UpdateStoneColorRequest,
  BrandsResponse,
  BrandResponse,
  CollectionsResponse,
  CollectionResponse,
  StonesResponse,
  StoneResponse,
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

// Stone Collections (PE API)
export async function fetchStoneCollections(brandId?: string, includeInactive = false): Promise<StoneCollection[]> {
  const params = new URLSearchParams();
  if (includeInactive) params.set('all', 'true');
  if (brandId) params.set('brandId', brandId);
  
  const url = `/api/admin/stone-collections${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<CollectionsResponse>(response);
  return data.collections;
}

export async function createStoneCollection(
  data: CreateStoneCollectionRequest
): Promise<StoneCollection> {
  const response = await fetch('/api/admin/stone-collections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await handleResponse<CollectionResponse>(response);
  return result.collection;
}

// Stones (PE API)
export async function fetchStones(brandId?: string, collectionId?: string, includeInactive = false): Promise<Stone[]> {
  const params = new URLSearchParams();
  if (includeInactive) params.set('all', 'true');
  if (brandId) params.set('brandId', brandId);
  if (collectionId) params.set('collectionId', collectionId);
  
  const url = `/api/admin/stones${params.toString() ? `?${params.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await handleResponse<StonesResponse>(response);
  return data.stones;
}

export async function createStone(
  data: CreateStoneRequest
): Promise<Stone> {
  const response = await fetch('/api/admin/stones', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await handleResponse<StoneResponse>(response);
  return result.stone;
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
