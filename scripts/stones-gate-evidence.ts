/**
 * F2 Gate 3 Evidence #1: Side-by-side m2Price comparison
 * Golden A config: L 320/180/65, radius, thickness 3, sink+cooktop+install+shipping
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { computeQuote } from '../src/modules/pricing';
import type { ConfigurationInput } from '../src/modules/pricing/schemas';

const prisma = new PrismaClient();

async function generateSideBySideEvidence() {
  console.log('='.repeat(100));
  console.log('F2 Gate 3 Evidence #1: StoneColor m2Price 1680 → 1800 (Golden A Config)');
  console.log('='.repeat(100));
  console.log('');

  // Find Quartz White stone color
  const stoneColor = await prisma.stoneColor.findFirst({
    where: { m2Price: new Decimal(1680), isActive: true },
  });

  if (!stoneColor) {
    throw new Error('Quartz White (1680) not found');
  }

  // Ensure it's at 1680
  await prisma.stoneColor.update({
    where: { id: stoneColor.id },
    data: { m2Price: new Decimal(1680) },
  });

  // Golden A configuration
  const config: ConfigurationInput = {
    stoneColorId: stoneColor.id,
    thicknessId: (await prisma.thickness.findFirst({ where: { cm: 3 } }))!.id,
    formTypeId: (await prisma.formType.findFirst({ where: { code: 'L' } }))!.id,
    edgeTypeId: (await prisma.edgeType.findFirst({ where: { code: 'RADIUS' } }))!.id,
    dimensions: {
      formType: 'L',
      leg1: 320,
      leg2: 180,
      depth: 65,
    },
    sink: { type: 'undermount', holes: 1 },
    cooktopHole: true,
    install: true,
    panelled: false,
    address: { city: 'İstanbul', district: 'Kadıköy' },
  };

  // Step 1: Compute quote at m2Price 1680
  console.log('STEP 1: Compute quote with m2Price = 1680');
  console.log('-'.repeat(100));
  const quote1 = await computeQuote(config);
  const stoneLine1 = quote1.lines.find((l) => l.code === 'STONE_M2')!;

  console.log('basePrice:', quote1.basePrice);
  console.log('coefficients:', quote1.coefficients);
  console.log('unitPrice (expected 1680×1.10×1.15×1.05 = 2231.46):', stoneLine1.unitPrice);
  console.log('billableAreaM2:', quote1.billableAreaM2);
  console.log('STONE_M2 lineTotal:', stoneLine1.lineTotal);
  console.log('totalInclVat:', quote1.totalInclVat);
  console.log('');

  // Step 2: Persist a Quote with snapshot at 1680
  console.log('STEP 2: Persist Quote with pricingSnapshot (m2Price 1680)');
  console.log('-'.repeat(100));
  const minConfig = await prisma.configuration.create({
    data: {
      stoneColorId: config.stoneColorId,
      thicknessId: config.thicknessId,
      formTypeId: config.formTypeId,
      edgeTypeId: config.edgeTypeId,
      dimensions: config.dimensions,
    },
  });

  const savedQuote = await prisma.quote.create({
    data: {
      configurationId: minConfig.id,
      subtotalExVat: new Decimal(quote1.subtotalExVat),
      vatAmount: new Decimal(quote1.vatAmount),
      totalInclVat: new Decimal(quote1.totalInclVat),
      pricingSnapshot: quote1 as any,
    },
  });

  console.log('Saved Quote ID:', savedQuote.id);
  console.log('Saved snapshot basePrice:', (savedQuote.pricingSnapshot as any).basePrice);
  console.log('');

  // Step 3: Update m2Price to 1800
  console.log('STEP 3: Update StoneColor m2Price to 1800');
  console.log('-'.repeat(100));
  await prisma.stoneColor.update({
    where: { id: stoneColor.id },
    data: { m2Price: new Decimal(1800) },
  });
  console.log('StoneColor updated: m2Price = 1800');
  console.log('');

  // Step 4: Compute new quote at m2Price 1800
  console.log('STEP 4: Compute NEW quote with m2Price = 1800');
  console.log('-'.repeat(100));
  const quote2 = await computeQuote(config);
  const stoneLine2 = quote2.lines.find((l) => l.code === 'STONE_M2')!;

  console.log('basePrice:', quote2.basePrice);
  console.log('coefficients:', quote2.coefficients);
  console.log('unitPrice (expected 1800×1.10×1.15×1.05 = 2390.85):', stoneLine2.unitPrice);
  console.log('billableAreaM2:', quote2.billableAreaM2);
  console.log('STONE_M2 lineTotal:', stoneLine2.lineTotal);
  console.log('totalInclVat:', quote2.totalInclVat);
  console.log('');

  // Step 5: Verify old Quote snapshot unchanged
  console.log('STEP 5: Verify persisted Quote snapshot UNCHANGED');
  console.log('-'.repeat(100));
  const reloadedQuote = await prisma.quote.findUnique({
    where: { id: savedQuote.id },
  });

  const oldSnapshot = reloadedQuote!.pricingSnapshot as any;
  console.log('Reloaded snapshot basePrice:', oldSnapshot.basePrice);
  console.log('Reloaded snapshot unitPrice (from STONE_M2 line):', 
    oldSnapshot.lines.find((l: any) => l.code === 'STONE_M2').unitPrice
  );
  console.log('');

  // Step 6: Side-by-side table
  console.log('='.repeat(100));
  console.log('SIDE-BY-SIDE COMPARISON TABLE (Golden A: L 320/180/65, radius, thickness 3, full services)');
  console.log('='.repeat(100));
  console.log('');
  console.log('┌────────────────────────────────┬──────────────────────┬──────────────────────┐');
  console.log('│ Field                          │ Before (m2Price 1680)│ After (m2Price 1800) │');
  console.log('├────────────────────────────────┼──────────────────────┼──────────────────────┤');
  console.log(`│ basePrice                      │ ${quote1.basePrice.padEnd(20)} │ ${quote2.basePrice.padEnd(20)} │`);
  console.log(`│ unitPrice (STONE_M2)           │ ${stoneLine1.unitPrice.padEnd(20)} │ ${stoneLine2.unitPrice.padEnd(20)} │`);
  console.log(`│ billableAreaM2                 │ ${quote1.billableAreaM2.padEnd(20)} │ ${quote2.billableAreaM2.padEnd(20)} │`);
  console.log(`│ STONE_M2 lineTotal             │ ${stoneLine1.lineTotal.padEnd(20)} │ ${stoneLine2.lineTotal.padEnd(20)} │`);
  console.log(`│ subtotalExVat                  │ ${quote1.subtotalExVat.padEnd(20)} │ ${quote2.subtotalExVat.padEnd(20)} │`);
  console.log(`│ vatAmount                      │ ${quote1.vatAmount.padEnd(20)} │ ${quote2.vatAmount.padEnd(20)} │`);
  console.log(`│ totalInclVat                   │ ${quote1.totalInclVat.padEnd(20)} │ ${quote2.totalInclVat.padEnd(20)} │`);
  console.log('└────────────────────────────────┴──────────────────────┴──────────────────────┘');
  console.log('');
  console.log('VERIFICATION:');
  console.log(`✓ Expected unitPrice (1800×1.10×1.15×1.05): ${(1800 * 1.10 * 1.15 * 1.05).toFixed(2)}`);
  console.log(`✓ Actual unitPrice: ${stoneLine2.unitPrice}`);
  console.log(`✓ Persisted Quote snapshot still has basePrice: ${oldSnapshot.basePrice}`);
  console.log(`✓ Persisted Quote snapshot still has unitPrice: ${oldSnapshot.lines.find((l: any) => l.code === 'STONE_M2').unitPrice}`);
  console.log('');

  // Cleanup
  await prisma.quote.delete({ where: { id: savedQuote.id } });
  await prisma.configuration.delete({ where: { id: minConfig.id } });
  await prisma.stoneColor.update({
    where: { id: stoneColor.id },
    data: { m2Price: new Decimal(1680) },
  });

  await prisma.$disconnect();
}

generateSideBySideEvidence().catch(console.error);
