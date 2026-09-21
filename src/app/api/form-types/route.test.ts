/**
 * Integration tests for GET /api/form-types
 */

import { GET } from './route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/form-types', () => {
  it('returns list of active form types with correct formatting', async () => {
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

  it('returns seeded form types (STRAIGHT, L, U, ISLAND)', async () => {
    const response = await GET();
    const data = await response.json() as any;

    const codes = data.map((ft: any) => ft.code);
    expect(codes).toContain('STRAIGHT');
    expect(codes).toContain('L');
    expect(codes).toContain('U');
    expect(codes).toContain('ISLAND');

    // Verify seed coefficients
    const formTypeL = data.find((ft: any) => ft.code === 'L');
    expect(formTypeL.coefficient).toBe('1.15');
    expect(formTypeL.nameTr).toBeTruthy();
  });

  it('returns items ordered by code ascending', async () => {
    const response = await GET();
    const data = await response.json() as any;

    const codes = data.map((ft: any) => ft.code);
    const sortedCodes = [...codes].sort();
    expect(codes).toEqual(sortedCodes);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
