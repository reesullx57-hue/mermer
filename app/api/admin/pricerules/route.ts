import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { PriceRule, CreatePriceRuleRequest } from '@/lib/types/pricerule';

const mockRules: PriceRule[] = [
  {
    id: '1',
    code: 'SINK_HOLE',
    version: 1,
    validFrom: '2024-01-01T00:00:00.000Z',
    validTo: null,
    value: '300.00',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-09-20T10:00:00.000Z',
    updatedBy: 'admin@demo.local',
  },
  {
    id: '2',
    code: 'COOKTOP_HOLE',
    version: 1,
    validFrom: '2024-01-01T00:00:00.000Z',
    validTo: null,
    value: '250.00',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-09-20T10:00:00.000Z',
    updatedBy: 'admin@demo.local',
  },
  {
    id: '3',
    code: 'INSTALL',
    version: 1,
    validFrom: '2024-01-01T00:00:00.000Z',
    validTo: null,
    value: '500.00',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-09-20T10:00:00.000Z',
    updatedBy: 'admin@demo.local',
  },
  {
    id: '4',
    code: 'WASTE_DEFAULT_PERCENT',
    version: 1,
    validFrom: '2024-01-01T00:00:00.000Z',
    validTo: null,
    value: '0.15',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-09-20T10:00:00.000Z',
    updatedBy: 'admin@demo.local',
  },
  {
    id: '5',
    code: 'MIN_AREA_M2',
    version: 1,
    validFrom: '2024-01-01T00:00:00.000Z',
    validTo: null,
    value: '2.5',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-09-20T10:00:00.000Z',
    updatedBy: 'admin@demo.local',
  },
  {
    id: '6',
    code: 'MIN_ORDER_AMOUNT',
    version: 1,
    validFrom: '2024-01-01T00:00:00.000Z',
    validTo: null,
    value: '1000.00',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-09-20T10:00:00.000Z',
    updatedBy: 'admin@demo.local',
  },
];

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
      { status: 403 }
    );
  }

  return NextResponse.json(mockRules);
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
      { status: 403 }
    );
  }

  const data: CreatePriceRuleRequest = await request.json();

  const newRule: PriceRule = {
    id: String(mockRules.length + 1),
    code: data.code,
    version: 1,
    validFrom: data.validFrom,
    validTo: data.validTo || null,
    value: data.value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: session.email,
  };

  mockRules.push(newRule);

  return NextResponse.json(newRule, { status: 201 });
}
