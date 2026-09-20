import type {
  PriceRule,
  AuditLogEntry,
} from '@/lib/types/pricerule';

export const mockRules: Map<string, PriceRule> = new Map([
  [
    '1',
    {
      id: '1',
      code: 'SINK_HOLE',
      version: 1,
      validFrom: '2024-01-01T00:00:00.000Z',
      validTo: null,
      value: '300.00',
      createdAt: '2024-01-01T10:00:00.000Z',
      updatedAt: '2024-09-20T10:00:00.000Z',
    },
  ],
  [
    '2',
    {
      id: '2',
      code: 'COOKTOP_HOLE',
      version: 1,
      validFrom: '2024-01-01T00:00:00.000Z',
      validTo: null,
      value: '250.00',
      createdAt: '2024-01-01T10:00:00.000Z',
      updatedAt: '2024-09-20T10:00:00.000Z',
    },
  ],
  [
    '3',
    {
      id: '3',
      code: 'INSTALL',
      version: 1,
      validFrom: '2024-01-01T00:00:00.000Z',
      validTo: null,
      value: '500.00',
      createdAt: '2024-01-01T10:00:00.000Z',
      updatedAt: '2024-09-20T10:00:00.000Z',
    },
  ],
  [
    '4',
    {
      id: '4',
      code: 'WASTE_DEFAULT_PERCENT',
      version: 1,
      validFrom: '2024-01-01T00:00:00.000Z',
      validTo: null,
      value: '0.15',
      createdAt: '2024-01-01T10:00:00.000Z',
      updatedAt: '2024-09-20T10:00:00.000Z',
    },
  ],
  [
    '5',
    {
      id: '5',
      code: 'MIN_AREA_M2',
      version: 1,
      validFrom: '2024-01-01T00:00:00.000Z',
      validTo: null,
      value: '2.5',
      createdAt: '2024-01-01T10:00:00.000Z',
      updatedAt: '2024-09-20T10:00:00.000Z',
    },
  ],
  [
    '6',
    {
      id: '6',
      code: 'MIN_ORDER_AMOUNT',
      version: 1,
      validFrom: '2024-01-01T00:00:00.000Z',
      validTo: null,
      value: '1000.00',
      createdAt: '2024-01-01T10:00:00.000Z',
      updatedAt: '2024-09-20T10:00:00.000Z',
    },
  ],
]);

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-1',
    entityType: 'PRICE_RULE',
    entityId: '1',
    action: 'CREATE',
    userId: 'user-admin',
    userName: 'Admin User',
    userEmail: 'admin@demo.local',
    changes: null,
    createdAt: '2024-01-01T10:00:00.000Z',
  },
];
