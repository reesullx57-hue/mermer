import type {
  StoneBrandWithAudit,
  StoneCollectionWithAudit,
  StoneWithAudit,
  StoneColorWithAudit,
  CreateStoneBrandRequest,
  UpdateStoneBrandRequest,
  CreateStoneCollectionRequest,
  UpdateStoneCollectionRequest,
  CreateStoneRequest,
  UpdateStoneRequest,
  CreateStoneColorRequest,
  UpdateStoneColorRequest,
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

// Stone Brands
export async function fetchStoneBrands(): Promise<StoneBrandWithAudit[]> {
  const response = await fetch('/api/admin/stones/brands', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<StoneBrandWithAudit[]>(response);
}

export async function createStoneBrand(
  data: CreateStoneBrandRequest
): Promise<StoneBrandWithAudit> {
  const response = await fetch('/api/admin/stones/brands', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<StoneBrandWithAudit>(response);
}

export async function updateStoneBrand(
  id: string,
  data: UpdateStoneBrandRequest
): Promise<StoneBrandWithAudit> {
  const response = await fetch(`/api/admin/stones/brands/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<StoneBrandWithAudit>(response);
}

export async function deleteStoneBrand(id: string): Promise<void> {
  const response = await fetch(`/api/admin/stones/brands/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw await handleResponse(response);
  }
}

// Stone Collections
export async function fetchStoneCollections(): Promise<StoneCollectionWithAudit[]> {
  const response = await fetch('/api/admin/stones/collections', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<StoneCollectionWithAudit[]>(response);
}

export async function createStoneCollection(
  data: CreateStoneCollectionRequest
): Promise<StoneCollectionWithAudit> {
  const response = await fetch('/api/admin/stones/collections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<StoneCollectionWithAudit>(response);
}

export async function updateStoneCollection(
  id: string,
  data: UpdateStoneCollectionRequest
): Promise<StoneCollectionWithAudit> {
  const response = await fetch(`/api/admin/stones/collections/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<StoneCollectionWithAudit>(response);
}

export async function deleteStoneCollection(id: string): Promise<void> {
  const response = await fetch(`/api/admin/stones/collections/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw await handleResponse(response);
  }
}

// Stones
export async function fetchStones(): Promise<StoneWithAudit[]> {
  const response = await fetch('/api/admin/stones', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<StoneWithAudit[]>(response);
}

export async function createStone(
  data: CreateStoneRequest
): Promise<StoneWithAudit> {
  const response = await fetch('/api/admin/stones', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<StoneWithAudit>(response);
}

export async function updateStone(
  id: string,
  data: UpdateStoneRequest
): Promise<StoneWithAudit> {
  const response = await fetch(`/api/admin/stones/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<StoneWithAudit>(response);
}

export async function deleteStone(id: string): Promise<void> {
  const response = await fetch(`/api/admin/stones/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw await handleResponse(response);
  }
}

// Stone Colors
export async function fetchStoneColors(): Promise<StoneColorWithAudit[]> {
  const response = await fetch('/api/admin/stones/colors', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<StoneColorWithAudit[]>(response);
}

export async function createStoneColor(
  data: CreateStoneColorRequest
): Promise<StoneColorWithAudit> {
  const response = await fetch('/api/admin/stones/colors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<StoneColorWithAudit>(response);
}

export async function updateStoneColor(
  id: string,
  data: UpdateStoneColorRequest
): Promise<StoneColorWithAudit> {
  const response = await fetch(`/api/admin/stones/colors/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<StoneColorWithAudit>(response);
}

export async function deleteStoneColor(id: string): Promise<void> {
  const response = await fetch(`/api/admin/stones/colors/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw await handleResponse(response);
  }
}
