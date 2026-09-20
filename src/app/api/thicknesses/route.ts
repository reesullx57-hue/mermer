/**
 * GET /api/thicknesses
 * Returns list of active thickness options with coefficients
 * Contract v1.1.0 - ADR-014
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const thicknesses = await prisma.thickness.findMany({
      where: { isActive: true },
      orderBy: { cm: 'asc' },
    });

    const response = thicknesses.map((t) => ({
      id: t.id,
      code: String(t.cm), // "2", "3", "4" for FE consistency
      cm: t.cm, // Keep numeric value for convenience
      nameTr: t.nameTr,
      coefficient: new Decimal(t.coefficient).toFixed(2),
      isActive: t.isActive,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching thicknesses:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch thicknesses',
        },
      },
      { status: 500 }
    );
  }
}
