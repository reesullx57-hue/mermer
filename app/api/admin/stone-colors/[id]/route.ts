import { NextRequest, NextResponse } from 'next/server';
import { mockColors } from '@/lib/mock-data';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  const colorIndex = mockColors.findIndex(c => c.id === id);
  
  if (colorIndex === -1) {
    return NextResponse.json(
      { error: { code: 'COLOR_NOT_FOUND', message: 'Color not found' } },
      { status: 404 }
    );
  }
  
  // Update the color
  mockColors[colorIndex] = {
    ...mockColors[colorIndex],
    ...body,
  };
  
  return NextResponse.json({ color: mockColors[colorIndex] });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const colorIndex = mockColors.findIndex(c => c.id === id);
  
  if (colorIndex === -1) {
    return NextResponse.json(
      { error: { code: 'COLOR_NOT_FOUND', message: 'Color not found' } },
      { status: 404 }
    );
  }
  
  mockColors.splice(colorIndex, 1);
  
  return NextResponse.json({ success: true });
}
