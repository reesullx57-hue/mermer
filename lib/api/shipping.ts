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

  const data = await handleResponse<{ zones: ShippingZoneWithAudit[] }>(response);
  return data.zones;
}

export async function createShippingZone(
  data: CreateShippingZoneRequest
): Promise<ShippingZoneWithAudit> {
  const payload = {
    city: data.city,
    district: data.district,
    fee: parseFloat(data.fee),
    installAvailable: data.installAvailable,
    isActive: data.isActive,
  };

  const response = await fetch('/api/admin/shipping-zones', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<{ zone: ShippingZoneWithAudit }>(response);
  return result.zone;
}

export async function updateShippingZone(
  id: string,
  data: UpdateShippingZoneRequest
): Promise<ShippingZoneWithAudit> {
  const payload: any = {};
  if (data.fee !== undefined) payload.fee = parseFloat(data.fee);
  if (data.installAvailable !== undefined) payload.installAvailable = data.installAvailable;
  if (data.isActive !== undefined) payload.isActive = data.isActive;

  const response = await fetch(`/api/admin/shipping-zones/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await handleResponse<{ zone: ShippingZoneWithAudit }>(response);
  return result.zone;
}

export { ShippingApiError };
