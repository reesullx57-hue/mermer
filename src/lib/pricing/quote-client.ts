import type { QuoteFormData, QuoteResponse, QuoteError } from '@/types/quote';

const MOCK_ENABLED = process.env.NEXT_PUBLIC_PRICING_MOCK === 'true';

function calculateArea(formData: QuoteFormData): number {
  const { formType, dimensions } = formData;
  
  switch (formType) {
    case 'STRAIGHT':
    case 'ISLAND':
      return (dimensions.length || 0) * (dimensions.depth || 0);
    
    case 'L': {
      const leg1Area = (dimensions.leg1 || 0) * (dimensions.depth || 0);
      const leg2Area = (dimensions.leg2 || 0) * (dimensions.depth || 0);
      const cornerSubtraction = (dimensions.depth || 0) * (dimensions.depth || 0);
      return leg1Area + leg2Area - cornerSubtraction;
    }
    
    case 'U': {
      const leg1Area = (dimensions.leg1 || 0) * (dimensions.depth || 0);
      const leg2Area = (dimensions.leg2 || 0) * (dimensions.depth || 0);
      const leg3Area = (dimensions.leg3 || 0) * (dimensions.depth || 0);
      const cornerSubtraction1 = (dimensions.depth || 0) * (dimensions.depth || 0);
      const cornerSubtraction2 = (dimensions.depth || 0) * (dimensions.depth || 0);
      return leg1Area + leg2Area + leg3Area - cornerSubtraction1 - cornerSubtraction2;
    }
    
    default:
      return 0;
  }
}

function generateMockResponse(formData: QuoteFormData): QuoteResponse {
  const area = calculateArea(formData);
  const wastePercent = 0.05;
  const wasteSource = 'global';
  
  const baseUnitPrice = 1500;
  const thicknessMultiplier = formData.thickness === 2 ? 1 : formData.thickness === 3 ? 1.3 : 1.6;
  
  const lines: QuoteResponse['lines'] = [];
  
  const countertopQuantity = area * (1 + wastePercent);
  const countertopUnitPrice = baseUnitPrice * thicknessMultiplier;
  const countertopTotal = countertopQuantity * countertopUnitPrice;
  
  lines.push({
    code: 'COUNTERTOP',
    label: 'Tezgah',
    unit: 'm²',
    quantity: countertopQuantity.toFixed(2),
    unitPrice: countertopUnitPrice.toFixed(2),
    lineTotal: countertopTotal.toFixed(2),
  });
  
  if (formData.edgeType !== 'straight') {
    const edgePriceMap = { radius: 150, bevel: 120, iron: 180 };
    const edgePrice = edgePriceMap[formData.edgeType as keyof typeof edgePriceMap] || 100;
    const perimeter = calculatePerimeter(formData);
    
    lines.push({
      code: 'EDGE',
      label: 'Kenar İşleme',
      unit: 'm',
      quantity: perimeter.toFixed(2),
      unitPrice: edgePrice.toFixed(2),
      lineTotal: (perimeter * edgePrice).toFixed(2),
    });
  }
  
  if (formData.sink.type !== 'none') {
    const sinkPrice = formData.sink.type === 'undermount' ? 250 : 150;
    lines.push({
      code: 'SINK',
      label: 'Eviye Kesimi',
      unit: 'adet',
      quantity: '1.00',
      unitPrice: sinkPrice.toFixed(2),
      lineTotal: sinkPrice.toFixed(2),
    });
  }
  
  if (formData.cooktopHole) {
    lines.push({
      code: 'COOKTOP',
      label: 'Ocak Kesimi',
      unit: 'adet',
      quantity: '1.00',
      unitPrice: '200.00',
      lineTotal: '200.00',
    });
  }
  
  if (formData.skirting.enabled && formData.skirting.heightCm) {
    const skirtingPrice = 80;
    const perimeter = calculatePerimeter(formData);
    const skirtingTotal = perimeter * skirtingPrice;
    
    lines.push({
      code: 'SKIRTING',
      label: 'Süpürgelik',
      unit: 'm',
      quantity: perimeter.toFixed(2),
      unitPrice: skirtingPrice.toFixed(2),
      lineTotal: skirtingTotal.toFixed(2),
    });
  }
  
  if (formData.trim.enabled) {
    const trimPrice = 120;
    const perimeter = calculatePerimeter(formData);
    const trimTotal = perimeter * trimPrice;
    
    lines.push({
      code: 'TRIM',
      label: 'Bordür',
      unit: 'm',
      quantity: perimeter.toFixed(2),
      unitPrice: trimPrice.toFixed(2),
      lineTotal: trimTotal.toFixed(2),
    });
  }
  
  if (formData.sideBox.enabled && formData.sideBox.sizeCm) {
    const boxPrice = 350;
    lines.push({
      code: 'SIDEBOX',
      label: 'Yan Kutu',
      unit: 'adet',
      quantity: '1.00',
      unitPrice: boxPrice.toFixed(2),
      lineTotal: boxPrice.toFixed(2),
    });
  }
  
  if (formData.panelled) {
    const panelPrice = 450;
    lines.push({
      code: 'PANEL',
      label: 'Panel Kaplama',
      unit: 'adet',
      quantity: '1.00',
      unitPrice: panelPrice.toFixed(2),
      lineTotal: panelPrice.toFixed(2),
    });
  }
  
  if (formData.install) {
    const installPrice = 800;
    lines.push({
      code: 'INSTALL',
      label: 'Montaj',
      unit: 'adet',
      quantity: '1.00',
      unitPrice: installPrice.toFixed(2),
      lineTotal: installPrice.toFixed(2),
    });
  }
  
  const subtotal = lines.reduce((sum, line) => sum + parseFloat(line.lineTotal), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;
  
  return {
    lines,
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    wastePercent,
    wasteSource,
  };
}

function calculatePerimeter(formData: QuoteFormData): number {
  const { formType, dimensions } = formData;
  
  switch (formType) {
    case 'STRAIGHT':
    case 'ISLAND':
      return 2 * ((dimensions.length || 0) + (dimensions.depth || 0));
    
    case 'L':
      return (dimensions.leg1 || 0) + (dimensions.leg2 || 0) + 2 * (dimensions.depth || 0);
    
    case 'U':
      return (dimensions.leg1 || 0) + (dimensions.leg2 || 0) + (dimensions.leg3 || 0) + 2 * (dimensions.depth || 0);
    
    default:
      return 0;
  }
}

export async function getQuote(formData: QuoteFormData): Promise<QuoteResponse> {
  if (MOCK_ENABLED) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return generateMockResponse(formData);
  }
  
  try {
    const response = await fetch('/api/pricing/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return generateMockResponse(formData);
      }
      
      const error: QuoteError = await response.json();
      throw new Error(error.message || 'Failed to get quote');
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateMockResponse(formData);
    }
    throw error;
  }
}
