import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type {
  StoneCollectionWithAudit,
  CreateStoneCollectionRequest,
} from '@/lib/types/stone';
import { mockCollections, mockBrands, mockAuditLogs, type AuditLogEntry } from '@/lib/mock-data/stones';

function getLastUpdater(entityId: string): StoneCollectionWithAudit['lastUpdater'] {
  const auditEntry = mockAuditLogs
    .filter((log) => log.entityType === 'STONE_COLLECTION' && log.entityId === entityId && log.action === 'UPDATE')
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

  const collectionsWithAudit: StoneCollectionWithAudit[] = mockCollections.map((collection) => {
    const brand = mockBrands.find((b) => b.id === collection.brandId);
    return {
      ...collection,
      brandName: brand?.name || undefined,
      lastUpdater: getLastUpdater(collection.id),
    };
  });

  return NextResponse.json(collectionsWithAudit);
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
      { status: 403 }
    );
  }

  const data: CreateStoneCollectionRequest = await request.json();
  const brand = mockBrands.find((b) => b.id === data.brandId);

  const newCollection: StoneCollectionWithAudit = {
    id: String(mockCollections.length + 1),
    brandId: data.brandId,
    brandName: brand?.name || undefined,
    name: data.name,
    isActive: data.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUpdater: null,
  };

  mockCollections.push(newCollection);

  const auditEntry: AuditLogEntry = {
    id: String(mockAuditLogs.length + 1),
    entityType: 'STONE_COLLECTION',
    entityId: newCollection.id,
    action: 'CREATE',
    userId: session.userId,
    userName: session.email.split('@')[0],
    userEmail: session.email,
    changes: JSON.stringify(data),
    createdAt: new Date().toISOString(),
  };
  mockAuditLogs.push(auditEntry);

  return NextResponse.json(newCollection, { status: 201 });
}
