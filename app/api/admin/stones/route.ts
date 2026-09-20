import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type {
  StoneWithAudit,
  CreateStoneRequest,
} from '@/lib/types/stone';
import { mockStones, mockCollections, mockBrands, mockAuditLogs, type AuditLogEntry } from '@/lib/mock-data/stones';

function getLastUpdater(entityId: string): StoneWithAudit['lastUpdater'] {
  const auditEntry = mockAuditLogs
    .filter((log) => log.entityType === 'STONE' && log.entityId === entityId && log.action === 'UPDATE')
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

  const stonesWithAudit: StoneWithAudit[] = mockStones.map((stone) => {
    const collection = mockCollections.find((c) => c.id === stone.collectionId);
    const brand = collection ? mockBrands.find((b) => b.id === collection.brandId) : undefined;
    return {
      ...stone,
      collectionName: collection?.name || undefined,
      brandName: brand?.name || undefined,
      lastUpdater: getLastUpdater(stone.id),
    };
  });

  return NextResponse.json(stonesWithAudit);
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
      { status: 403 }
    );
  }

  const data: CreateStoneRequest = await request.json();
  const collection = mockCollections.find((c) => c.id === data.collectionId);
  const brand = collection ? mockBrands.find((b) => b.id === collection.brandId) : undefined;

  const newStone: StoneWithAudit = {
    id: String(mockStones.length + 1),
    collectionId: data.collectionId,
    collectionName: collection?.name || undefined,
    brandName: brand?.name || undefined,
    name: data.name,
    textureUrl: data.textureUrl || null,
    isActive: data.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUpdater: null,
  };

  mockStones.push(newStone);

  const auditEntry: AuditLogEntry = {
    id: String(mockAuditLogs.length + 1),
    entityType: 'STONE',
    entityId: newStone.id,
    action: 'CREATE',
    userId: session.userId,
    userName: session.email.split('@')[0],
    userEmail: session.email,
    changes: JSON.stringify(data),
    createdAt: new Date().toISOString(),
  };
  mockAuditLogs.push(auditEntry);

  return NextResponse.json(newStone, { status: 201 });
}
