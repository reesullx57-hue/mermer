import { NextRequest, NextResponse } from 'next/server';
import { mockColors } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const stoneId = searchParams.get('stoneId');
  const includeInactive = searchParams.get('all') === 'true';
  
  let colors = [...mockColors];
  
  if (stoneId) {
    colors = colors.filter(c => c.stoneId === stoneId);
  }
  
  if (!includeInactive) {
    colors = colors.filter(c => c.isActive);
  }
  
  return NextResponse.json({ colors });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const newColor = {
    id: `color${mockColors.length + 1}`,
    ...body,
    stone: {
      id: body.stoneId,
      code: 'MOCK_STONE',
      nameTr: 'Mock Stone',
      brand: {
        id: 'brand1',
        code: 'MOCK',
        nameTr: 'Mock Brand'
      }
    }
  };
  
  mockColors.push(newColor);
  
  return NextResponse.json({ color: newColor });
}
