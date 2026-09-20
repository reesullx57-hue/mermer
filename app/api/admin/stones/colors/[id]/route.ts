import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { UpdateStoneColorRequest } from '@/lib/types/stone';
import { mockStoneColors, mockStones, mockAuditLogs, type AuditLogEntry } from '@/lib/mock-data/stones';

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
  const data: UpdateStoneColorRequest = await request.json();

  const colorIndex = mockStoneColors.findIndex((c) => c.id === id);

  if (colorIndex === -1) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Color not found' } },
      { status: 404 }
    );
  }

  const updatedColor = {
    ...mockStoneColors[colorIndex],
    ...(data.stoneId !== undefined && { stoneId: data.stoneId }),
    ...(data.name !== undefined && { name: data.name }),
    ...(data.m2Price !== undefined && { m2Price: data.m2Price }),
    ...(data.wastePercent !== undefined && { wastePercent: data.wastePercent }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
    updatedAt: new Date().toISOString(),
  };

  if (data.stoneId) {
    const stone = mockStones.find((s) => s.id === data.stoneId);
    updatedColor.stoneName = stone?.name;
  }

  mockStoneColors[colorIndex] = updatedColor;

  const auditEntry: AuditLogEntry = {
    id: String(mockAuditLogs.length + 1),
    entityType: 'STONE_COLOR',
    entityId: id,
    action: 'UPDATE',
    userId: session.userId,
    userName: session.email.split('@')[0],
    userEmail: session.email,
    changes: JSON.stringify(data),
    createdAt: new Date().toISOString(),
  };
  mockAuditLogs.push(auditEntry);

  const colorWithAudit = {
    ...updatedColor,
    lastUpdater: {
      email: session.email,
      name: session.email.split('@')[0],
      timestamp: auditEntry.createdAt,
    },
  };

  return NextResponse.json(colorWithAudit);
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
  const colorIndex = mockStoneColors.findIndex((c) => c.id === id);

  if (colorIndex === -1) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Color not found' } },
      { status: 404 }
    );
  }

  mockStoneColors.splice(colorIndex, 1);

  const auditEntry: AuditLogEntry = {
    id: String(mockAuditLogs.length + 1),
    entityType: 'STONE_COLOR',
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
