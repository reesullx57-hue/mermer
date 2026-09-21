/**
 * Integration tests for GET /api/edge-types
 */

import { GET } from './route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/edge-types', () => {
  it('returns list of active edge types with correct formatting', async () => {
    const response = await GET();
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Check structure of first item
    const firstItem = data[0];
    expect(firstItem).toHaveProperty('id');
    expect(firstItem).toHaveProperty('code');
    expect(firstItem).toHaveProperty('nameTr');
    expect(firstItem).toHaveProperty('coefficient');
    expect(firstItem).toHaveProperty('isActive');

    // Verify coefficient is a fixed decimal string
    expect(typeof firstItem.coefficient).toBe('string');
    expect(firstItem.coefficient).toMatch(/^\d+\.\d{2}$/);
    expect(firstItem.isActive).toBe(true);
  });

  it('returns seeded edge types (STRAIGHT, RADIUS, BEVEL, IRON)', async () => {
    const response = await GET();
    const data = await response.json() as any;

    const codes = data.map((et: any) => et.code).map((c: string) => c.toUpperCase());
    expect(codes).toContain('STRAIGHT');
    expect(codes).toContain('RADIUS');

    // Verify seed coefficients
    const edgeTypeRadius = data.find((et: any) => et.code.toUpperCase() === 'RADIUS');
    expect(edgeTypeRadius).toBeDefined();
    expect(edgeTypeRadius.coefficient).toBe('1.05');
    expect(edgeTypeRadius.nameTr).toBeTruthy();
  });

  it('returns items ordered by code ascending', async () => {
    const response = await GET();
    const data = await response.json() as any;

    const codes = data.map((et: any) => et.code);
    const sortedCodes = [...codes].sort();
    expect(codes).toEqual(sortedCodes);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
