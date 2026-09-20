import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { UpdateStoneCollectionRequest } from '@/lib/types/stone';
import { mockCollections, mockBrands, mockAuditLogs, type AuditLogEntry } from '@/lib/mock-data/stones';

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
  const data: UpdateStoneCollectionRequest = await request.json();

  const collectionIndex = mockCollections.findIndex((c) => c.id === id);

  if (collectionIndex === -1) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Collection not found' } },
      { status: 404 }
    );
  }

  const updatedCollection = {
    ...mockCollections[collectionIndex],
    ...(data.brandId !== undefined && { brandId: data.brandId }),
    ...(data.name !== undefined && { name: data.name }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    updatedAt: new Date().toISOString(),
  };

  if (data.brandId) {
    const brand = mockBrands.find((b) => b.id === data.brandId);
    updatedCollection.brandName = brand?.name;
  }

  mockCollections[collectionIndex] = updatedCollection;

  const auditEntry: AuditLogEntry = {
    id: String(mockAuditLogs.length + 1),
    entityType: 'STONE_COLLECTION',
    entityId: id,
    action: 'UPDATE',
    userId: session.userId,
    userName: session.email.split('@')[0],
    userEmail: session.email,
    changes: JSON.stringify(data),
    createdAt: new Date().toISOString(),
  };
  mockAuditLogs.push(auditEntry);

  const collectionWithAudit = {
    ...updatedCollection,
    lastUpdater: {
      email: session.email,
      name: session.email.split('@')[0],
      timestamp: auditEntry.createdAt,
    },
  };

  return NextResponse.json(collectionWithAudit);
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
  const collectionIndex = mockCollections.findIndex((c) => c.id === id);

  if (collectionIndex === -1) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Collection not found' } },
      { status: 404 }
    );
  }

  mockCollections.splice(collectionIndex, 1);

  const auditEntry: AuditLogEntry = {
    id: String(mockAuditLogs.length + 1),
    entityType: 'STONE_COLLECTION',
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
