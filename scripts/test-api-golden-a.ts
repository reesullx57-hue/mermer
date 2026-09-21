/**
 * Test API with Golden A configuration
 */

import { POST } from '../src/app/api/pricing/quote/route';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

async function testGoldenA() {
  console.log('Testing POST /api/pricing/quote with Golden A configuration\n');

  // Find seed data IDs
  const [stoneColor, thickness, formType, edgeType] = await Promise.all([
    prisma.stoneColor.findFirst({
      where: { code: 'WHITE', stone: { code: 'QUARTZ-001' } },
    }),
    prisma.thickness.findFirst({ where: { cm: 3 } }),
    prisma.formType.findFirst({ where: { code: 'L' } }),
    prisma.edgeType.findFirst({ where: { code: 'RADIUS' } }),
  ]);

  if (!stoneColor || !thickness || !formType || !edgeType) {
    throw new Error('Seed data not found');
  }

  const requestBody = {
    stoneColorId: stoneColor.id,
    thicknessId: thickness.id,
    formTypeId: formType.id,
    edgeTypeId: edgeType.id,
    dimensions: {
      formType: 'L',
      leg1: 320,
      leg2: 180,
      depth: 65,
    },
    sinkHoles: 1,
    cooktopHole: true,
    install: true,
    skirtingEnabled: false,
    trimEnabled: false,
    address: {
      city: 'İstanbul',
      district: 'Kadıköy',
    },
  };

  const request = new NextRequest('http://localhost:3000/api/pricing/quote', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  const response = await POST(request);
  const data = await response.json();

  console.log('✅ Golden A Response:\n');
  console.log(JSON.stringify(data, null, 2));

  await prisma.$disconnect();
}

testGoldenA().catch(console.error);
