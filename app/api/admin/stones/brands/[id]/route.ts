import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { UpdateStoneBrandRequest } from '@/lib/types/stone';
import { mockBrands, mockAuditLogs, type AuditLogEntry } from '@/lib/mock-data/stones';

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
  const data: UpdateStoneBrandRequest = await request.json();

  const brandIndex = mockBrands.findIndex((b) => b.id === id);

  if (brandIndex === -1) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Brand not found' } },
      { status: 404 }
    );
  }

  const updatedBrand = {
    ...mockBrands[brandIndex],
    ...(data.name !== undefined && { name: data.name }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    updatedAt: new Date().toISOString(),
  };

  mockBrands[brandIndex] = updatedBrand;

  const auditEntry: AuditLogEntry = {
    id: String(mockAuditLogs.length + 1),
    entityType: 'STONE_BRAND',
    entityId: id,
    action: 'UPDATE',
    userId: session.userId,
    userName: session.email.split('@')[0],
    userEmail: session.email,
    changes: JSON.stringify(data),
    createdAt: new Date().toISOString(),
  };
  mockAuditLogs.push(auditEntry);

  const brandWithAudit = {
    ...updatedBrand,
    lastUpdater: {
      email: session.email,
      name: session.email.split('@')[0],
      timestamp: auditEntry.createdAt,
    },
  };

  return NextResponse.json(brandWithAudit);
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
  const brandIndex = mockBrands.findIndex((b) => b.id === id);

  if (brandIndex === -1) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Brand not found' } },
      { status: 404 }
    );
  }

  mockBrands.splice(brandIndex, 1);

  const auditEntry: AuditLogEntry = {
    id: String(mockAuditLogs.length + 1),
    entityType: 'STONE_BRAND',
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
