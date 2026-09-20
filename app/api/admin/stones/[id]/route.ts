import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { UpdateStoneRequest } from '@/lib/types/stone';
import { mockStones, mockCollections, mockBrands, mockAuditLogs, type AuditLogEntry } from '@/lib/mock-data/stones';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
      { status: 403 }
    );
  }

  const { id } = await params;
  const data: UpdateStoneRequest = await request.json();

  const stoneIndex = mockStones.findIndex((s) => s.id === id);

  if (stoneIndex === -1) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Stone not found' } },
      { status: 404 }
    );
  }

  const updatedStone = {
    ...mockStones[stoneIndex],
    ...(data.collectionId !== undefined && { collectionId: data.collectionId }),
    ...(data.name !== undefined && { name: data.name }),
    ...(data.textureUrl !== undefined && { textureUrl: data.textureUrl }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    updatedAt: new Date().toISOString(),
  };

  if (data.collectionId) {
    const collection = mockCollections.find((c) => c.id === data.collectionId);
    const brand = collection ? mockBrands.find((b) => b.id === collection.brandId) : undefined;
    updatedStone.collectionName = collection?.name;
    updatedStone.brandName = brand?.name;
  }

  mockStones[stoneIndex] = updatedStone;

  const auditEntry: AuditLogEntry = {
    id: String(mockAuditLogs.length + 1),
    entityType: 'STONE',
    entityId: id,
    action: 'UPDATE',
    userId: session.userId,
    userName: session.email.split('@')[0],
    userEmail: session.email,
    changes: JSON.stringify(data),
    createdAt: new Date().toISOString(),
  };
  mockAuditLogs.push(auditEntry);

  const stoneWithAudit = {
    ...updatedStone,
    lastUpdater: {
      email: session.email,
      name: session.email.split('@')[0],
      timestamp: auditEntry.createdAt,
    },
  };

  return NextResponse.json(stoneWithAudit);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
      { status: 403 }
    );
  }

  const { id } = await params;
  const stoneIndex = mockStones.findIndex((s) => s.id === id);

  if (stoneIndex === -1) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Stone not found' } },
      { status: 404 }
    );
  }

  mockStones.splice(stoneIndex, 1);

  const auditEntry: AuditLogEntry = {
    id: String(mockAuditLogs.length + 1),
    entityType: 'STONE',
    entityId: id,
    action: 'DELETE',
    userId: session.userId,
    userName: session.email.split('@')[0],
    userEmail: session.email,
    changes: null,
    createdAt: new Date().toISOString(),
  };
  mockAuditLogs.push(auditEntry);

  return NextResponse.json({}, { status: 204 });
}
