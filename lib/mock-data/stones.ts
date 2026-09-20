import type {
  StoneBrand,
  StoneCollection,
  Stone,
  StoneColor,
} from '@/lib/types/stone';

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  userId: string;
  userName: string | null;
  userEmail: string;
  changes: string | null;
  createdAt: string;
}

export const mockBrands: StoneBrand[] = [
  {
    id: '1',
    name: 'Marmara Mermer',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Ege Granit',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockCollections: StoneCollection[] = [
  {
    id: '1',
    brandId: '1',
    brandName: 'Marmara Mermer',
    name: 'Klasik Serisi',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    brandId: '2',
    brandName: 'Ege Granit',
    name: 'Premium Koleksiyon',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockStones: Stone[] = [
  {
    id: '1',
    collectionId: '1',
    collectionName: 'Klasik Serisi',
    brandName: 'Marmara Mermer',
    name: 'Beyaz Mermer',
    textureUrl: '/local/textures/beyaz-mermer.jpg',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    collectionId: '2',
    collectionName: 'Premium Koleksiyon',
    brandName: 'Ege Granit',
    name: 'Siyah Granit',
    textureUrl: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockStoneColors: StoneColor[] = [
  {
    id: '1',
    stoneId: '1',
    stoneName: 'Beyaz Mermer',
    name: 'Kar Beyazı',
    m2Price: '450.00',
    wastePercent: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    stoneId: '2',
    stoneName: 'Siyah Granit',
    name: 'Gece Siyahı',
    m2Price: '650.50',
    wastePercent: null,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockAuditLogs: AuditLogEntry[] = [];
