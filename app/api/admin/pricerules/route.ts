import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type {
  PriceRule,
  PriceRuleWithAudit,
  CreatePriceRuleRequest,
  AuditLogEntry,
} from '@/lib/types/pricerule';

export const mockRules: Map<string, PriceRule> = new Map([
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
    },
  ],
]);

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-1',
    entityType: 'PRICE_RULE',
    entityId: '1',
    action: 'CREATE',
    userId: 'user-admin',
    userName: 'Admin User',
    userEmail: 'admin@demo.local',
    changes: null,
    createdAt: '2024-01-01T10:00:00.000Z',
  },
];

function getLatestAuditLog(entityId: string): AuditLogEntry | null {
  const logs = mockAuditLogs
    .filter((log) => log.entityId === entityId && log.action === 'UPDATE')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return logs[0] || null;
}

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

  const rulesWithAudit: PriceRuleWithAudit[] = Array.from(mockRules.values()).map(
    (rule) => {
      const latestLog = getLatestAuditLog(rule.id);
      return {
        ...rule,
        lastUpdater: latestLog
          ? {
              email: latestLog.userEmail,
              name: latestLog.userName,
              timestamp: latestLog.createdAt,
            }
          : null,
      };
    }
  );

  return NextResponse.json(rulesWithAudit);
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

  const newId = String(mockRules.size + 1);
  const newRule: PriceRule = {
    id: newId,
    code: data.code,
    version: 1,
    validFrom: data.validFrom,
    validTo: data.validTo || null,
    value: data.value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockRules.set(newId, newRule);

  const auditLog: AuditLogEntry = {
    id: `audit-${mockAuditLogs.length + 1}`,
    entityType: 'PRICE_RULE',
    entityId: newId,
    action: 'CREATE',
    userId: session.userId,
    userName: session.email.split('@')[0],
    userEmail: session.email,
    changes: JSON.stringify({ created: newRule }),
    createdAt: new Date().toISOString(),
  };
  mockAuditLogs.push(auditLog);

  const ruleWithAudit: PriceRuleWithAudit = {
    ...newRule,
    lastUpdater: null,
  };

  return NextResponse.json(ruleWithAudit, { status: 201 });
}
