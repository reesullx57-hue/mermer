/**
 * Generate L golden snapshot WITHOUT dealer
 * Run with: npx tsx src/modules/pricing/l-golden-no-dealer.ts
 */

import { PrismaClient } from '@prisma/client';
import { computeQuote } from './index';
import type { ConfigurationInput } from './schemas';

const prisma = new PrismaClient();

async function generateLGoldenNoDealer() {
  console.log('🔍 Loading seed data for L golden test (no dealer)...\n');

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
    throw new Error('Required seed data not found');
  }

  // Create configuration input WITHOUT dealerId
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
    // NO dealerId - so appliedDiscounts will be []
  };

  console.log('📊 Computing L golden quote (no dealer)...\n');

  // Compute quote
  const snapshot = await computeQuote(input);

  console.log('✅ L Golden Snapshot WITHOUT Dealer (Contract v1.0.0):\n');
  console.log(JSON.stringify(snapshot, null, 2));

  console.log('\n\n📋 Summary:');
  console.log(`  Unit Price: ${snapshot.lines[0].unitPrice} TRY/m²`);
  console.log(`  Billable Area: ${snapshot.lines[0].quantity} m²`);
  console.log(`  STONE_M2 Line Total: ${snapshot.lines[0].lineTotal} TRY`);
  console.log(`  Subtotal (ex-VAT): ${snapshot.subtotalExVat} TRY`);
  console.log(`  VAT (20%): ${snapshot.vatAmount} TRY`);
  console.log(`  Total (incl VAT): ${snapshot.totalInclVat} TRY`);

  await prisma.$disconnect();
}

generateLGoldenNoDealer().catch(console.error);
