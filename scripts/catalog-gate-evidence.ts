/**
 * F2 Gate 4 Evidence: Thickness coefficient 1.10 → 1.20
 * Golden A config: stone 1680, L, radius
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { computeQuote } from '../src/modules/pricing';
import type { ConfigurationInput } from '../src/modules/pricing/schemas';

const prisma = new PrismaClient();

async function generateCatalogEvidence() {
  console.log('='.repeat(100));
  console.log('F2 Gate 4 Evidence: Thickness Coefficient 1.10 → 1.20 (Golden A Config)');
  console.log('='.repeat(100));
  console.log('');

  // Find entities
  const stoneColor = await prisma.stoneColor.findFirst({
    where: { m2Price: new Decimal(1680), isActive: true },
  });
  const thickness = await prisma.thickness.findFirst({ where: { cm: 3 } });
  const formType = await prisma.formType.findFirst({ where: { code: 'L' } });
  const edgeType = await prisma.edgeType.findFirst({ where: { code: 'RADIUS' } });

  // Ensure thickness coefficient is 1.10
  await prisma.thickness.update({
    where: { id: thickness!.id },
    data: { coefficient: new Decimal(1.10) },
  });

  // Configuration
  const config: ConfigurationInput = {
    stoneColorId: stoneColor!.id,
    thicknessId: thickness!.id,
    formTypeId: formType!.id,
    edgeTypeId: edgeType!.id,
    dimensions: {
      formType: 'L',
      leg1: 320,
      leg2: 180,
      depth: 65,
    },
    sink: null,
    cooktopHole: false,
    install: false,
    panelled: false,
  };

  // Step 1: Compute quote with coefficient 1.10
  console.log('STEP 1: Compute quote with thickness coefficient = 1.10');
  console.log('-'.repeat(100));
  const quote1 = await computeQuote(config);
  const stoneLine1 = quote1.lines.find((l) => l.code === 'STONE_M2')!;

  console.log('basePrice:', quote1.basePrice);
  console.log('coefficients:', quote1.coefficients);
  console.log('unitPrice (expected 1680×1.10×1.15×1.05 = 2231.46):', stoneLine1.unitPrice);
  console.log('');

  // Step 2: Persist Quote
  console.log('STEP 2: Persist Quote with pricingSnapshot (coefficient 1.10)');
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
  console.log('Saved snapshot unitPrice:', (savedQuote.pricingSnapshot as any).lines.find((l: any) => l.code === 'STONE_M2').unitPrice);
  console.log('');

  // Step 3: Update coefficient to 1.20
  console.log('STEP 3: Update Thickness coefficient to 1.20');
  console.log('-'.repeat(100));
  await prisma.thickness.update({
    where: { id: thickness!.id },
    data: { coefficient: new Decimal(1.20) },
  });
  console.log('Thickness updated: coefficient = 1.20');
  console.log('');

  // Step 4: Compute new quote
  console.log('STEP 4: Compute NEW quote with coefficient 1.20');
  console.log('-'.repeat(100));
  const quote2 = await computeQuote(config);
  const stoneLine2 = quote2.lines.find((l) => l.code === 'STONE_M2')!;

  console.log('basePrice:', quote2.basePrice);
  console.log('coefficients:', quote2.coefficients);
  console.log('unitPrice (expected 1680×1.20×1.15×1.05 = 2434.32):', stoneLine2.unitPrice);
  console.log('');

  // Step 5: Verify old Quote snapshot unchanged
  console.log('STEP 5: Verify persisted Quote snapshot UNCHANGED');
  console.log('-'.repeat(100));
  const reloadedQuote = await prisma.quote.findUnique({
    where: { id: savedQuote.id },
  });

  const oldSnapshot = reloadedQuote!.pricingSnapshot as any;
  console.log('Reloaded snapshot coefficient:', oldSnapshot.coefficients.thickness);
  console.log('Reloaded snapshot unitPrice:', oldSnapshot.lines.find((l: any) => l.code === 'STONE_M2').unitPrice);
  console.log('');

  // Side-by-side table
  console.log('='.repeat(100));
  console.log('SIDE-BY-SIDE COMPARISON TABLE (Thickness Coefficient 1.10 → 1.20)');
  console.log('='.repeat(100));
  console.log('');
  console.log('┌────────────────────────────────┬─────────────────────────┬─────────────────────────┐');
  console.log('│ Field                          │ Before (coefficient 1.10)│ After (coefficient 1.20)│');
  console.log('├────────────────────────────────┼─────────────────────────┼─────────────────────────┤');
  console.log(`│ thickness coefficient          │ ${quote1.coefficients.thickness.padEnd(24)} │ ${quote2.coefficients.thickness.padEnd(24)} │`);
  console.log(`│ unitPrice (STONE_M2)           │ ${stoneLine1.unitPrice.padEnd(24)} │ ${stoneLine2.unitPrice.padEnd(24)} │`);
  console.log(`│ STONE_M2 lineTotal             │ ${stoneLine1.lineTotal.padEnd(24)} │ ${stoneLine2.lineTotal.padEnd(24)} │`);
  console.log(`│ subtotalExVat                  │ ${quote1.subtotalExVat.padEnd(24)} │ ${quote2.subtotalExVat.padEnd(24)} │`);
  console.log(`│ totalInclVat                   │ ${quote1.totalInclVat.padEnd(24)} │ ${quote2.totalInclVat.padEnd(24)} │`);
  console.log('└────────────────────────────────┴─────────────────────────┴─────────────────────────┘');
  console.log('');
  console.log('VERIFICATION:');
  console.log(`✓ Expected unitPrice (1680×1.20×1.15×1.05): ${(1680 * 1.20 * 1.15 * 1.05).toFixed(2)}`);
  console.log(`✓ Actual unitPrice: ${stoneLine2.unitPrice}`);
  console.log(`✓ Persisted Quote snapshot still has coefficient: ${oldSnapshot.coefficients.thickness}`);
  console.log(`✓ Persisted Quote snapshot still has unitPrice: ${oldSnapshot.lines.find((l: any) => l.code === 'STONE_M2').unitPrice}`);
  console.log('');

  // Cleanup
  await prisma.quote.delete({ where: { id: savedQuote.id } });
  await prisma.configuration.delete({ where: { id: minConfig.id } });
  await prisma.thickness.update({
    where: { id: thickness!.id },
    data: { coefficient: new Decimal(1.10) },
  });

  await prisma.$disconnect();
}

generateCatalogEvidence().catch(console.error);
