import { NextRequest, NextResponse } from 'next/server';

const mockCollections = [
  { id: 'coll1', brandId: 'brand1', code: 'CLASSIC', nameTr: 'Klasik Koleksiyon', isActive: true },
];

export async function GET() {
  return NextResponse.json({ collections: mockCollections });
}
