import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type {
  PriceRule,
  PriceRuleWithAudit,
  UpdatePriceRuleRequest,
  AuditLogEntry,
} from '@/lib/types/pricerule';
import { mockRules, mockAuditLogs } from '@/lib/mock-data/pricerules';

function getLatestAuditLog(entityId: string): AuditLogEntry | null {
  const logs = mockAuditLogs
    .filter((log) => log.entityId === entityId && log.action === 'UPDATE')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return logs[0] || null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
  const oldValue = { ...rule };

  const updatedRule: PriceRule = {
    ...rule,
    version: rule.version + 1,
    validFrom: data.validFrom !== undefined ? data.validFrom : rule.validFrom,
    validTo: data.validTo !== undefined ? data.validTo : rule.validTo,
    value: data.value !== undefined ? data.value : rule.value,
    updatedAt: new Date().toISOString(),
  };

  mockRules.set(id, updatedRule);

  const changes: Record<string, { old: any; new: any }> = {};
  if (data.validFrom !== undefined) changes.validFrom = { old: oldValue.validFrom, new: data.validFrom };
  if (data.validTo !== undefined) changes.validTo = { old: oldValue.validTo, new: data.validTo };
  if (data.value !== undefined) changes.value = { old: oldValue.value, new: data.value };

  const auditLog: AuditLogEntry = {
    id: `audit-${mockAuditLogs.length + 1}`,
    entityType: 'PRICE_RULE',
    entityId: id,
    action: 'UPDATE',
    userId: session.userId,
    userName: session.email.split('@')[0],
    userEmail: session.email,
    changes: JSON.stringify(changes),
    createdAt: new Date().toISOString(),
  };
  mockAuditLogs.push(auditLog);

  const ruleWithAudit: PriceRuleWithAudit = {
    ...updatedRule,
    lastUpdater: {
      email: auditLog.userEmail,
      name: auditLog.userName,
      timestamp: auditLog.createdAt,
    },
  };

  return NextResponse.json(ruleWithAudit);
}
