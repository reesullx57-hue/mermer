import { NextRequest, NextResponse } from 'next/server';

const mockStones = [
  { id: 'stone1', brandId: 'brand1', collectionId: 'coll1', code: 'CARRARA', nameTr: 'Carrara Mermer', isActive: true },
  { id: 'stone2', brandId: 'brand2', collectionId: null, code: 'EMPERADOR', nameTr: 'Emperador Mermer', isActive: true },
];

export async function GET() {
  return NextResponse.json({ stones: mockStones });
}
