/**
 * Integration tests for GET /api/thicknesses
 */

import { GET } from './route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/thicknesses', () => {
  it('returns list of active thicknesses with correct formatting', async () => {
    const response = await GET();
    const data = await response.json() as any;

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Check structure of first item
    const firstItem = data[0];
    expect(firstItem).toHaveProperty('id');
    expect(firstItem).toHaveProperty('code');
    expect(firstItem).toHaveProperty('cm');
    expect(firstItem).toHaveProperty('nameTr');
    expect(firstItem).toHaveProperty('coefficient');
    expect(firstItem).toHaveProperty('isActive');

    // Verify code is string matching cm
    expect(typeof firstItem.code).toBe('string');
    expect(firstItem.code).toBe(String(firstItem.cm));

    // Verify coefficient is a fixed decimal string
    expect(typeof firstItem.coefficient).toBe('string');
    expect(firstItem.coefficient).toMatch(/^\d+\.\d{2}$/);
    expect(firstItem.isActive).toBe(true);
  });

  it('returns seeded thickness options (2cm, 3cm, 4cm)', async () => {
    const response = await GET();
    const data = await response.json() as any;

    const cms = data.map((t: any) => t.cm);
    expect(cms).toContain(2);
    expect(cms).toContain(3);
    expect(cms).toContain(4);

    // Verify codes match cm values
    const codes = data.map((t: any) => t.code);
    expect(codes).toContain('2');
    expect(codes).toContain('3');
    expect(codes).toContain('4');

    // Verify seed coefficients
    const thickness3 = data.find((t: any) => t.cm === 3);
    expect(thickness3.code).toBe('3');
    expect(thickness3.coefficient).toBe('1.10');
    expect(thickness3.nameTr).toContain('3');
  });

  it('returns items ordered by cm ascending', async () => {
    const response = await GET();
    const data = await response.json() as any;

    const cms = data.map((t: any) => t.cm);
    const sortedCms = [...cms].sort((a, b) => a - b);
    expect(cms).toEqual(sortedCms);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
