import type { QuoteFormData, QuoteResponse, QuoteError } from '@/types/quote';

const MOCK_ENABLED = false; // Live API only, no mock default

export async function getQuote(formData: QuoteFormData): Promise<QuoteResponse> {
  if (MOCK_ENABLED) {
    throw new Error('Mock mode is disabled. Live API only.');
  }
  
  try {
    // Build nested request payload per PO requirements
    const requestBody = {
      stoneColorId: formData.stoneColorId,
      thicknessId: formData.thicknessId,
      formTypeId: formData.formTypeId,
      edgeTypeId: formData.edgeTypeId,
      dimensions: formData.dimensions,
      sink: formData.sink,
      cooktopHole: formData.cooktopHole,
      install: formData.install,
      skirting: formData.skirting,
      trim: formData.trim,
      sideBox: formData.sideBox,
      panelled: formData.panelled,
      address: formData.address,
      dealerId: formData.dealerId || null,
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
