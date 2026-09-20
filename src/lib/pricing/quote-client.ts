import type { QuoteFormData, QuoteResponse, QuoteError } from '@/types/quote';

const MOCK_ENABLED = process.env.NEXT_PUBLIC_PRICING_MOCK === 'true';

export async function getQuote(formData: QuoteFormData): Promise<QuoteResponse> {
  if (MOCK_ENABLED) {
    throw new Error('Mock mode is no longer supported. Please use the live API.');
  }
  
  try {
    // Build the request payload according to the pricing engine contract
    const requestBody = {
      stoneColorId: formData.stoneColorId,
      thicknessId: formData.thicknessId,
      formTypeId: formData.formTypeId,
      edgeTypeId: formData.edgeTypeId,
      dimensions: formData.dimensions,
      sinkHoles: formData.sinkHoles,
      cooktopHole: formData.cooktopHole,
      install: formData.install,
      skirtingEnabled: formData.skirtingEnabled,
      skirtingHeightCm: formData.skirtingHeightCm,
      trimEnabled: formData.trimEnabled,
      trimModel: formData.trimModel,
      address: formData.address,
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
