// Stone catalog entity types

export interface StoneBrand {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoneBrandWithAudit extends StoneBrand {
  lastUpdater: {
    email: string;
    name: string | null;
    timestamp: string;
  } | null;
}

export interface StoneCollection {
  id: string;
  brandId: string;
  brandName?: string; // For display in list views
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoneCollectionWithAudit extends StoneCollection {
  lastUpdater: {
    email: string;
    name: string | null;
    timestamp: string;
  } | null;
}

export interface Stone {
  id: string;
  collectionId: string;
  collectionName?: string; // For display
  brandName?: string; // For display
  name: string;
  textureUrl: string | null; // Local path or placeholder URL (ADR-019)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoneWithAudit extends Stone {
  lastUpdater: {
    email: string;
    name: string | null;
    timestamp: string;
  } | null;
}

export interface StoneColor {
  id: string;
  stoneId: string;
  stoneName?: string; // For display
  name: string;
  m2Price: string; // Decimal string (e.g., "150.50")
  wastePercent: number | null; // Nullable
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoneColorWithAudit extends StoneColor {
  lastUpdater: {
    email: string;
    name: string | null;
    timestamp: string;
  } | null;
}

// Request types
export interface CreateStoneBrandRequest {
  name: string;
  isActive: boolean;
}

export interface UpdateStoneBrandRequest {
  name?: string;
  isActive?: boolean;
}

export interface CreateStoneCollectionRequest {
  brandId: string;
  name: string;
  isActive: boolean;
}

export interface UpdateStoneCollectionRequest {
  brandId?: string;
  name?: string;
  isActive?: boolean;
}

export interface CreateStoneRequest {
  collectionId: string;
  name: string;
  textureUrl?: string | null;
  isActive: boolean;
}

export interface UpdateStoneRequest {
  collectionId?: string;
  name?: string;
  textureUrl?: string | null;
  isActive?: boolean;
}

export interface CreateStoneColorRequest {
  stoneId: string;
  name: string;
  m2Price: string;
  wastePercent?: number | null;
  isActive: boolean;
}

export interface UpdateStoneColorRequest {
  stoneId?: string;
  name?: string;
  m2Price?: string;
  wastePercent?: number | null;
  isActive?: boolean;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
