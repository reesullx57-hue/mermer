import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type {
  StoneColorWithAudit,
  CreateStoneColorRequest,
} from '@/lib/types/stone';
import { mockStoneColors, mockStones, mockAuditLogs, type AuditLogEntry } from '@/lib/mock-data/stones';

function getLastUpdater(entityId: string): StoneColorWithAudit['lastUpdater'] {
  const auditEntry = mockAuditLogs
    .filter((log) => log.entityType === 'STONE_COLOR' && log.entityId === entityId && log.action === 'UPDATE')
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

  const colorsWithAudit: StoneColorWithAudit[] = mockStoneColors.map((color) => {
    const stone = mockStones.find((s) => s.id === color.stoneId);
    return {
      ...color,
      stoneName: stone?.name || undefined,
      lastUpdater: getLastUpdater(color.id),
    };
  });

  return NextResponse.json(colorsWithAudit);
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
      { status: 403 }
    );
  }

  const data: CreateStoneColorRequest = await request.json();
  const stone = mockStones.find((s) => s.id === data.stoneId);

  const newColor: StoneColorWithAudit = {
    id: String(mockStoneColors.length + 1),
    stoneId: data.stoneId,
    stoneName: stone?.name || undefined,
    name: data.name,
    m2Price: data.m2Price,
    wastePercent: data.wastePercent ?? null,
    isActive: data.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUpdater: null,
  };

  mockStoneColors.push(newColor);

  const auditEntry: AuditLogEntry = {
    id: String(mockAuditLogs.length + 1),
    entityType: 'STONE_COLOR',
    entityId: newColor.id,
    action: 'CREATE',
    userId: session.userId,
    userName: session.email.split('@')[0],
    userEmail: session.email,
    changes: JSON.stringify(data),
    createdAt: new Date().toISOString(),
  };
  mockAuditLogs.push(auditEntry);

  return NextResponse.json(newColor, { status: 201 });
}
