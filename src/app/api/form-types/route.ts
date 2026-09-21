/**
 * GET /api/form-types
 * Returns list of active form type options with coefficients
 * Contract v1.1.0 - ADR-014
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const formTypes = await prisma.formType.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    const response = formTypes.map((ft) => ({
      id: ft.id,
      code: ft.code,
      nameTr: ft.nameTr,
      coefficient: new Decimal(ft.coefficient).toFixed(2),
      isActive: ft.isActive,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching form types:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch form types',
        },
      },
      { status: 500 }
    );
  }
}
