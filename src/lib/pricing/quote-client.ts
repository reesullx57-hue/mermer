import type { QuoteFormData, QuoteResponse, QuoteError } from '@/types/quote';

const MOCK_ENABLED = false; // Live API only, no mock default

/**
 * TEMPORARY: Transform nested PO structure to flat PE structure
 * 
 * NOTE: PE Zod schema still expects flat fields as of 2026-09-20.
 * Frontend uses nested structure per PO requirements.
 * This transformation layer will be removed once PE updates to nested schema.
 * 
 * PO Required (nested):
 *   - sink: { type, holes }
 *   - skirting: { enabled, heightCm }
 *   - trim: { enabled, model }
 *   - sideBox: { enabled, sizeCm }
 * 
 * PE Current (flat):
 *   - sinkHoles
 *   - skirtingEnabled, skirtingHeightCm
 *   - trimEnabled, trimModel
 */
function transformToFlatStructure(formData: QuoteFormData) {
  return {
    stoneColorId: formData.stoneColorId,
    thicknessId: formData.thicknessId,
    formTypeId: formData.formTypeId,
    edgeTypeId: formData.edgeTypeId,
    dimensions: formData.dimensions,
    // Transform nested sink to flat sinkHoles
    sinkHoles: formData.sink.type !== 'none' ? formData.sink.holes : 0,
    cooktopHole: formData.cooktopHole,
    install: formData.install,
    // Transform nested skirting to flat fields
    skirtingEnabled: formData.skirting.enabled,
    skirtingHeightCm: formData.skirting.heightCm,
    // Transform nested trim to flat fields
    trimEnabled: formData.trim.enabled,
    trimModel: formData.trim.model,
    address: formData.address,
    dealerId: formData.dealerId || undefined,
  };
}

export async function getQuote(formData: QuoteFormData): Promise<QuoteResponse> {
  if (MOCK_ENABLED) {
    throw new Error('Mock mode is disabled. Live API only.');
  }
  
  try {
    // TEMPORARY: Transform to flat structure until PE updates to nested schema
    const requestBody = transformToFlatStructure(formData);

    const response = await fetch('/api/pricing/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const error: QuoteError = await response.json();
      throw new Error(error.error.message || 'Failed to get quote');
    }
    
    const data: QuoteResponse = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}
