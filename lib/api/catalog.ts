/**
 * API client for catalog entity management
 * F2: /admin/catalog UI support
 */

import type {
  ThicknessWithAudit,
  FormTypeWithAudit,
  EdgeTypeWithAudit,
  CreateThicknessRequest,
  CreateFormTypeRequest,
  CreateEdgeTypeRequest,
  UpdateCatalogItemRequest,
  CatalogApiError,
} from '@/lib/types/catalog';

export class CatalogApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'CatalogApiError';
  }
}

// Thickness API functions
export async function fetchThicknesses(): Promise<ThicknessWithAudit[]> {
  const response = await fetch('/api/admin/thicknesses');
  if (!response.ok) {
    const error = await response.json();
    throw new CatalogApiError(
      error.error?.code || 'UNKNOWN_ERROR',
      error.error?.message || 'Failed to fetch thicknesses'
    );
  }
  return response.json();
}

export async function createThickness(
  data: CreateThicknessRequest
): Promise<ThicknessWithAudit> {
  const response = await fetch('/api/admin/thicknesses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new CatalogApiError(
      error.error?.code || 'UNKNOWN_ERROR',
      error.error?.message || 'Failed to create thickness'
    );
  }
  return response.json();
}

export async function updateThickness(
  id: string,
  data: UpdateCatalogItemRequest
): Promise<ThicknessWithAudit> {
  const response = await fetch(`/api/admin/thicknesses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new CatalogApiError(
      error.error?.code || 'UNKNOWN_ERROR',
      error.error?.message || 'Failed to update thickness'
    );
  }
  return response.json();
}

export async function deactivateThickness(id: string): Promise<void> {
  const response = await fetch(`/api/admin/thicknesses/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new CatalogApiError(
      error.error?.code || 'UNKNOWN_ERROR',
      error.error?.message || 'Failed to deactivate thickness'
    );
  }
}

// FormType API functions
export async function fetchFormTypes(): Promise<FormTypeWithAudit[]> {
  const response = await fetch('/api/admin/form-types');
  if (!response.ok) {
    const error = await response.json();
    throw new CatalogApiError(
      error.error?.code || 'UNKNOWN_ERROR',
      error.error?.message || 'Failed to fetch form types'
    );
  }
  return response.json();
}

export async function createFormType(
  data: CreateFormTypeRequest
): Promise<FormTypeWithAudit> {
  const response = await fetch('/api/admin/form-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new CatalogApiError(
      error.error?.code || 'UNKNOWN_ERROR',
      error.error?.message || 'Failed to create form type'
    );
  }
  return response.json();
}

export async function updateFormType(
  id: string,
  data: UpdateCatalogItemRequest
): Promise<FormTypeWithAudit> {
  const response = await fetch(`/api/admin/form-types/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new CatalogApiError(
      error.error?.code || 'UNKNOWN_ERROR',
      error.error?.message || 'Failed to update form type'
    );
  }
  return response.json();
}

export async function deactivateFormType(id: string): Promise<void> {
  const response = await fetch(`/api/admin/form-types/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new CatalogApiError(
      error.error?.code || 'UNKNOWN_ERROR',
      error.error?.message || 'Failed to deactivate form type'
    );
  }
}

// EdgeType API functions
export async function fetchEdgeTypes(): Promise<EdgeTypeWithAudit[]> {
  const response = await fetch('/api/admin/edge-types');
  if (!response.ok) {
    const error = await response.json();
    throw new CatalogApiError(
      error.error?.code || 'UNKNOWN_ERROR',
      error.error?.message || 'Failed to fetch edge types'
    );
  }
  return response.json();
}

export async function createEdgeType(
  data: CreateEdgeTypeRequest
): Promise<EdgeTypeWithAudit> {
  const response = await fetch('/api/admin/edge-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new CatalogApiError(
      error.error?.code || 'UNKNOWN_ERROR',
      error.error?.message || 'Failed to create edge type'
    );
  }
  return response.json();
}

export async function updateEdgeType(
  id: string,
  data: UpdateCatalogItemRequest
): Promise<EdgeTypeWithAudit> {
  const response = await fetch(`/api/admin/edge-types/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new CatalogApiError(
      error.error?.code || 'UNKNOWN_ERROR',
      error.error?.message || 'Failed to update edge type'
    );
  }
  return response.json();
}

export async function deactivateEdgeType(id: string): Promise<void> {
  const response = await fetch(`/api/admin/edge-types/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new CatalogApiError(
      error.error?.code || 'UNKNOWN_ERROR',
      error.error?.message || 'Failed to deactivate edge type'
    );
  }
}
