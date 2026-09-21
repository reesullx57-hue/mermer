import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type {
  PriceRule,
  PriceRuleWithAudit,
  CreatePriceRuleRequest,
  AuditLogEntry,
} from '@/lib/types/pricerule';
import { mockRules, mockAuditLogs } from '@/lib/mock-data/pricerules';

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
