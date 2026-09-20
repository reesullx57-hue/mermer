import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type {
  StoneBrand,
  StoneBrandWithAudit,
  CreateStoneBrandRequest,
} from '@/lib/types/stone';
import { mockBrands, mockAuditLogs, type AuditLogEntry } from '@/lib/mock-data/stones';

function getLastUpdater(entityId: string): StoneBrandWithAudit['lastUpdater'] {
  const auditEntry = mockAuditLogs
    .filter((log) => log.entityType === 'STONE_BRAND' && log.entityId === entityId && log.action === 'UPDATE')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (!auditEntry) return null;

  return {
    email: auditEntry.userEmail,
    name: auditEntry.userName,
    timestamp: auditEntry.createdAt,
  };
}

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
      { status: 403 }
    );
  }

  const brandsWithAudit: StoneBrandWithAudit[] = mockBrands.map((brand) => ({
    ...brand,
    lastUpdater: getLastUpdater(brand.id),
  }));

  return NextResponse.json(brandsWithAudit);
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
      { status: 403 }
    );
  }

  const data: CreateStoneBrandRequest = await request.json();

  const newBrand: StoneBrand = {
    id: String(mockBrands.length + 1),
    name: data.name,
    isActive: data.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockBrands.push(newBrand);

  const auditEntry: AuditLogEntry = {
    id: String(mockAuditLogs.length + 1),
    entityType: 'STONE_BRAND',
    entityId: newBrand.id,
    action: 'CREATE',
    userId: session.userId,
    userName: session.email.split('@')[0],
    userEmail: session.email,
    changes: JSON.stringify(data),
    createdAt: new Date().toISOString(),
  };
  mockAuditLogs.push(auditEntry);

  const brandWithAudit: StoneBrandWithAudit = {
    ...newBrand,
    lastUpdater: null,
  };

  return NextResponse.json(brandWithAudit, { status: 201 });
}
