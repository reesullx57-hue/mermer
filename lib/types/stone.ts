// Stone catalog entity types (PE API compatible)

export interface StoneBrand {
  id: string;
  code: string;
  nameTr: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    collections: number;
    stones: number;
  };
}

export interface StoneCollection {
  id: string;
  brandId: string;
  code: string;
  nameTr: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  brand?: {
    code: string;
    nameTr: string;
  };
  _count?: {
    stones: number;
  };
}

export interface Stone {
  id: string;
  brandId: string;
  collectionId: string | null;
  code: string;
  nameTr: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  brand?: {
    code: string;
    nameTr: string;
  };
  collection?: {
    code: string;
    nameTr: string;
  } | null;
  _count?: {
    colors: number;
  };
}

export interface StoneColor {
  id: string;
  stoneId: string;
  code: string;
  nameTr: string;
  m2Price: string; // Decimal string (e.g., "150.50")
  wastePercent: string | null; // Decimal string 0-1 range (e.g., "0.15" for 15%)
  isActive: boolean;
  textureUrl: string | null;
  createdAt: string;
  updatedAt: string;
  stone?: {
    code: string;
    nameTr: string;
    brand: {
      code: string;
      nameTr: string;
    };
  };
}

// Request types
export interface CreateStoneBrandRequest {
  code: string;
  nameTr: string;
  isActive?: boolean;
}

export interface UpdateStoneBrandRequest {
  nameTr?: string;
  isActive?: boolean;
}

export interface CreateStoneCollectionRequest {
  brandId: string;
  code: string;
  nameTr: string;
  isActive?: boolean;
}

export interface CreateStoneRequest {
  brandId: string;
  collectionId?: string | null;
  code: string;
  nameTr: string;
  isActive?: boolean;
}

export interface CreateStoneColorRequest {
  stoneId: string;
  code: string;
  nameTr: string;
  m2Price: number; // PE expects number, will convert from string
  wastePercent?: number | null; // 0-1 range, nullable
  isActive?: boolean;
  textureUrl?: string | null;
}

export interface UpdateStoneColorRequest {
  code?: string;
  nameTr?: string;
  m2Price?: number;
  wastePercent?: number | null;
  isActive?: boolean;
  textureUrl?: string | null;
}

// Wrapped response types (PE API format)
export interface BrandsResponse {
  brands: StoneBrand[];
}

export interface BrandResponse {
  brand: StoneBrand;
}

export interface CollectionsResponse {
  collections: StoneCollection[];
}

export interface CollectionResponse {
  collection: StoneCollection;
}

export interface StonesResponse {
  stones: Stone[];
}

export interface StoneResponse {
  stone: Stone;
}

export interface ColorsResponse {
  colors: StoneColor[];
}

export interface ColorResponse {
  color: StoneColor;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
