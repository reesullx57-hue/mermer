/**
 * Example script to generate a sample pricing snapshot
 * Run with: npx tsx src/modules/pricing/example-snapshot.ts
 */

import { PrismaClient } from '@prisma/client';
import { computeQuote } from './index';
import type { ConfigurationInput } from './schemas';

const prisma = new PrismaClient();

async function generateExampleSnapshot() {
  console.log('🔍 Loading seed data...\n');

  // Find seed data IDs
  const [stoneColor, thickness, formType, edgeType, dealer] = await Promise.all([
    prisma.stoneColor.findFirst({
      where: { code: 'WHITE', stone: { code: 'QUARTZ-001' } },
    }),
    prisma.thickness.findFirst({ where: { cm: 3 } }),
    prisma.formType.findFirst({ where: { code: 'L' } }),
    prisma.edgeType.findFirst({ where: { code: 'RADIUS' } }),
    prisma.dealer.findFirst({ where: { code: 'DLR-001' } }),
  ]);

  if (!stoneColor || !thickness || !formType || !edgeType) {
    throw new Error('Required seed data not found');
  }

  // Create configuration input
  const input: ConfigurationInput = {
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
    address: {
      city: 'İstanbul',
      district: 'Kadıköy',
    },
    dealerId: dealer?.id,
  };

  console.log('📊 Computing quote...\n');

  // Compute quote
  const snapshot = await computeQuote(input);

  console.log('✅ Pricing Snapshot (Contract v1.0.0):\n');
  console.log(JSON.stringify(snapshot, null, 2));

  await prisma.$disconnect();
}

generateExampleSnapshot().catch(console.error);
