import type { QuoteFormData, QuoteResponse, QuoteError } from '@/types/quote';

const MOCK_ENABLED = false; // Live API only, no mock default

export async function getQuote(formData: QuoteFormData): Promise<QuoteResponse> {
  if (MOCK_ENABLED) {
    throw new Error('Mock mode is disabled. Live API only.');
  }
  
  try {
    // Build nested request payload - PE now accepts nested structure
    const requestBody = {
      stoneColorId: formData.stoneColorId,
      thicknessId: formData.thicknessId,
      formTypeId: formData.formTypeId,
      edgeTypeId: formData.edgeTypeId,
      dimensions: formData.dimensions,
      sink: {
        type: formData.sink.type,
        holes: formData.sink.holes,
      },
      cooktopHole: formData.cooktopHole,
      install: formData.install,
      skirting: {
        enabled: formData.skirting.enabled,
        ...(formData.skirting.heightCm && { heightCm: formData.skirting.heightCm }),
      },
      trim: {
        enabled: formData.trim.enabled,
        ...(formData.trim.model && { model: formData.trim.model }),
      },
      panelled: formData.panelled,
      sideBox: {
        enabled: formData.sideBox.enabled,
        ...(formData.sideBox.sizeCm && { sizeCm: formData.sideBox.sizeCm }),
      },
      address: formData.address,
      ...(formData.dealerId && { dealerId: formData.dealerId }),
    };

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
