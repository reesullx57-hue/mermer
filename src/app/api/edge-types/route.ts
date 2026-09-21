/**
 * GET /api/edge-types
 * Returns list of active edge type options with coefficients
 * Contract v1.1.0 - ADR-014
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const edgeTypes = await prisma.edgeType.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    const response = edgeTypes.map((et) => ({
      id: et.id,
      code: et.code,
      nameTr: et.nameTr,
      coefficient: new Decimal(et.coefficient).toFixed(2),
      isActive: et.isActive,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching edge types:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch edge types',
        },
      },
      { status: 500 }
    );
  }
}
