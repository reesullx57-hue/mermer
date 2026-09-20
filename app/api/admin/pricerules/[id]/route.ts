import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { PriceRule, UpdatePriceRuleRequest } from '@/lib/types/pricerule';

const mockRules: Map<string, PriceRule> = new Map([
  [
    '1',
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
  ],
  [
    '2',
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
  ],
  [
    '3',
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
  ],
  [
    '4',
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
  ],
  [
    '5',
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
  ],
  [
    '6',
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
  ],
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const { id } = await params;
  const rule = mockRules.get(id);

  if (!rule) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Price rule not found' } },
      { status: 404 }
    );
  }

  const data: UpdatePriceRuleRequest = await request.json();

  const updatedRule: PriceRule = {
    ...rule,
    version: rule.version + 1,
    validFrom: data.validFrom !== undefined ? data.validFrom : rule.validFrom,
    validTo: data.validTo !== undefined ? data.validTo : rule.validTo,
    value: data.value !== undefined ? data.value : rule.value,
    updatedAt: new Date().toISOString(),
    updatedBy: session.email,
  };

  mockRules.set(id, updatedRule);

  return NextResponse.json(updatedRule);
}
