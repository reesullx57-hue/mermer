/**
 * TypeScript types for catalog entities (Thickness, FormType, EdgeType)
 * F2: /admin/catalog UI support
 */

export interface CatalogItemWithAudit {
  id: string;
  nameTr: string;
  coefficient: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUpdater?: {
    email: string;
    timestamp: string;
  } | null;
}

export interface ThicknessWithAudit extends CatalogItemWithAudit {
  cm: number;
}

export interface FormTypeWithAudit extends CatalogItemWithAudit {
  code: string;
}

export interface EdgeTypeWithAudit extends CatalogItemWithAudit {
  code: string;
}

export interface CreateThicknessRequest {
  cm: number;
  nameTr: string;
  coefficient: string;
}

export interface CreateFormTypeRequest {
  code: string;
  nameTr: string;
  coefficient: string;
}

export interface CreateEdgeTypeRequest {
  code: string;
  nameTr: string;
  coefficient: string;
}

export interface UpdateCatalogItemRequest {
  nameTr?: string;
  coefficient?: string;
}

export interface CatalogApiError {
  code: string;
  message: string;
  details?: unknown;
}
