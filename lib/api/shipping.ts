import type {
  ShippingZoneWithAudit,
  CreateShippingZoneRequest,
  UpdateShippingZoneRequest,
  ApiError,
} from '@/lib/types/shipping';

class ShippingApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'ShippingApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiError | undefined;
    try {
      errorData = await response.json();
    } catch {
      throw new ShippingApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        'UNKNOWN_ERROR',
        response.status
      );
    }

    if (errorData?.error) {
      throw new ShippingApiError(
        errorData.error.message,
        errorData.error.code,
        response.status
      );
    }

    throw new ShippingApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      'UNKNOWN_ERROR',
      response.status
    );
  }

  return response.json();
}

export async function fetchShippingZones(): Promise<ShippingZoneWithAudit[]> {
  const response = await fetch('/api/admin/shipping-zones', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<ShippingZoneWithAudit[]>(response);
}

export async function createShippingZone(
  data: CreateShippingZoneRequest
): Promise<ShippingZoneWithAudit> {
  const response = await fetch('/api/admin/shipping-zones', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<ShippingZoneWithAudit>(response);
}

export async function updateShippingZone(
  id: string,
  data: UpdateShippingZoneRequest
): Promise<ShippingZoneWithAudit> {
  const response = await fetch(`/api/admin/shipping-zones/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return handleResponse<ShippingZoneWithAudit>(response);
}

export async function deleteShippingZone(id: string): Promise<void> {
  const response = await fetch(`/api/admin/shipping-zones/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ShippingApiError(
      errorData?.error?.message || 'Silme işlemi başarısız oldu',
      errorData?.error?.code || 'DELETE_FAILED',
      response.status
    );
  }
}

export { ShippingApiError };
