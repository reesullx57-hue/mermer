export interface ShippingZone {
  id: string;
  city: string;
  district: string;
  fee: string;
  installAvailable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingZoneWithAudit extends ShippingZone {
  lastUpdater: {
    email: string;
    name: string | null;
    timestamp: string;
  } | null;
}

export interface CreateShippingZoneRequest {
  city: string;
  district: string;
  fee: string;
  installAvailable: boolean;
  isActive: boolean;
}

export interface UpdateShippingZoneRequest {
  city?: string;
  district?: string;
  fee?: string;
  installAvailable?: boolean;
  isActive?: boolean;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
