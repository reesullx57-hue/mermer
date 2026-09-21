import { NextRequest, NextResponse } from 'next/server';

const mockBrands = [
  { id: 'brand1', code: 'ITALIAN', nameTr: 'İtalyan Mermer', isActive: true },
  { id: 'brand2', code: 'SPANISH', nameTr: 'İspanyol Mermer', isActive: true },
];

export async function GET() {
  return NextResponse.json({ brands: mockBrands });
}
