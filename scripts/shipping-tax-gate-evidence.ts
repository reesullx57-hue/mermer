/**
 * F2 Gate 5 Evidence: Shipping + Tax Cache Invalidation
 * Golden A: L 320/180/65, radius, thickness 3, quartz 1680, sink+cooktop+install+shipping Kadıköy
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { computeQuote, invalidatePricingCache } from '../src/modules/pricing';
import type { ConfigurationInput } from '../src/modules/pricing/schemas';

const prisma = new PrismaClient();

async function generateShippingTaxEvidence() {
  console.log('='.repeat(120));
  console.log('F2 Gate 5 Evidence: Shipping + Tax Cache Invalidation (Golden A Full Path)');
  console.log('='.repeat(120));
  console.log('');

  // Setup
  const stoneColor = await prisma.stoneColor.findFirst({
    where: { m2Price: new Decimal(1680), isActive: true },
  });
  const kadikoyZone = await prisma.shippingZone.findFirst({
    where: { city: 'İstanbul', district: 'Kadıköy' },
  });
  const taxConfig = await prisma.taxConfig.findUnique({
    where: { code: 'VAT_TR' },
  });

  // Ensure baseline: fee 400, vat 0.20
  await prisma.shippingZone.update({
    where: { id: kadikoyZone!.id },
    data: { fee: new Decimal(400) },
  });
  await prisma.taxConfig.update({
    where: { code: 'VAT_TR' },
    data: { vatRate: new Decimal(0.20) },
  });

  // Golden A config
  const config: ConfigurationInput = {
    stoneColorId: stoneColor!.id,
    thicknessId: (await prisma.thickness.findFirst({ where: { cm: 3 } }))!.id,
    formTypeId: (await prisma.formType.findFirst({ where: { code: 'L' } }))!.id,
    edgeTypeId: (await prisma.edgeType.findFirst({ where: { code: 'RADIUS' } }))!.id,
    dimensions: { formType: 'L', leg1: 320, leg2: 180, depth: 65 },
    sink: { type: 'undermount', holes: 1 },
    cooktopHole: true,
    install: true,
    panelled: false,
    address: { city: 'İstanbul', district: 'Kadıköy' },
  };

  // ========================================
  // EVIDENCE #1A: Shipping fee 400→500 (VAT stays 0.20)
  // ========================================
  console.log('EVIDENCE #1A: Shipping fee 400→500 (VAT stays 0.20)');
  console.log('-'.repeat(120));

  const quote1a = await computeQuote(config);
  console.log('Before (fee 400, VAT 0.20):');
  console.log('  subtotalExVat:', quote1a.subtotalExVat);
  console.log('  vatAmount:', quote1a.vatAmount);
  console.log('  totalInclVat:', quote1a.totalInclVat);
  console.log('  SHIPPING line:', quote1a.lines.find(l => l.code === 'SHIPPING')?.lineTotal);

  await prisma.shippingZone.update({
    where: { id: kadikoyZone!.id },
    data: { fee: new Decimal(500) },
  });
  await invalidatePricingCache();

  const quote1b = await computeQuote(config);
  console.log('\\nAfter (fee 500, VAT 0.20):');
  console.log('  subtotalExVat:', quote1b.subtotalExVat);
  console.log('  vatAmount:', quote1b.vatAmount);
  console.log('  totalInclVat:', quote1b.totalInclVat);
  console.log('  SHIPPING line:', quote1b.lines.find(l => l.code === 'SHIPPING')?.lineTotal);
  console.log('');

  // Restore fee to 400 for next test
  await prisma.shippingZone.update({
    where: { id: kadikoyZone!.id },
    data: { fee: new Decimal(400) },
  });

  // ========================================
  // EVIDENCE #1B: VAT 0.20→0.18 (shipping stays 400)
  // ========================================
  console.log('EVIDENCE #1B: VAT 0.20→0.18 (shipping stays 400)');
  console.log('-'.repeat(120));

  const quote2a = await computeQuote(config);
  console.log('Before (fee 400, VAT 0.20):');
  console.log('  subtotalExVat:', quote2a.subtotalExVat);
  console.log('  vatAmount:', quote2a.vatAmount);
  console.log('  totalInclVat:', quote2a.totalInclVat);
  console.log('  vatRate:', quote2a.vatRate);

  await prisma.taxConfig.update({
    where: { code: 'VAT_TR' },
    data: { vatRate: new Decimal(0.18) },
  });
  await invalidatePricingCache();

  const quote2b = await computeQuote(config);
  console.log('\\nAfter (fee 400, VAT 0.18):');
  console.log('  subtotalExVat:', quote2b.subtotalExVat);
  console.log('  vatAmount:', quote2b.vatAmount);
  console.log('  totalInclVat:', quote2b.totalInclVat);
  console.log('  vatRate:', quote2b.vatRate);
  console.log('');

  // Restore VAT to 0.20
  await prisma.taxConfig.update({
    where: { code: 'VAT_TR' },
    data: { vatRate: new Decimal(0.20) },
  });

  // ========================================
  // EVIDENCE #2: COMBINED (fee 500 + VAT 0.18)
  // ========================================
  console.log('EVIDENCE #2: COMBINED (fee 500 + VAT 0.18)');
  console.log('-'.repeat(120));

  const quote3a = await computeQuote(config);
  console.log('Baseline (fee 400, VAT 0.20):');
  console.log('  subtotalExVat:', quote3a.subtotalExVat);
  console.log('  vatAmount:', quote3a.vatAmount);
  console.log('  totalInclVat:', quote3a.totalInclVat);

  // Apply BOTH changes
  await prisma.shippingZone.update({
    where: { id: kadikoyZone!.id },
    data: { fee: new Decimal(500) },
  });
  await prisma.taxConfig.update({
    where: { code: 'VAT_TR' },
    data: { vatRate: new Decimal(0.18) },
  });
  
  // Invalidate both tag groups
  console.log('\\nInvalidating cache (both tag groups)...');
  await invalidatePricingCache(); // shipping tags
  await invalidatePricingCache(); // tax tags (same function, called twice for evidence)

  const quote3b = await computeQuote(config);
  console.log('\\nCombined (fee 500, VAT 0.18):');
  console.log('  subtotalExVat:', quote3b.subtotalExVat);
  console.log('  vatAmount:', quote3b.vatAmount);
  console.log('  totalInclVat:', quote3b.totalInclVat);
  console.log('  SHIPPING line:', quote3b.lines.find(l => l.code === 'SHIPPING')?.lineTotal);
  console.log('  vatRate:', quote3b.vatRate);
  console.log('');

  // ========================================
  // EVIDENCE #3: City-wide unaffected
  // ========================================
  console.log('EVIDENCE #3: City-wide ShippingZone unaffected');
  console.log('-'.repeat(120));

  const zones = await prisma.shippingZone.findMany({
    where: { city: 'İstanbul' },
    orderBy: { district: 'asc' },
    select: {
      id: true,
      city: true,
      district: true,
      fee: true,
    },
  });

  console.log('ShippingZone query results (İstanbul):');
  zones.forEach(z => {
    console.log(`  ${z.city}/"${z.district}" → fee: ${new Decimal(z.fee).toFixed(2)}`);
  });
  console.log('');

  // ========================================
  // EVIDENCE #4: AuditLog entries
  // ========================================
  console.log('EVIDENCE #4: Latest AuditLog entries');
  console.log('-'.repeat(120));

  const shippingLog = await prisma.auditLog.findFirst({
    where: { entityType: 'ShippingZone' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      action: true,
      entityType: true,
      before: true,
      after: true,
      createdAt: true,
    },
  });

  const taxLog = await prisma.auditLog.findFirst({
    where: { entityType: 'TaxConfig' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      action: true,
      entityType: true,
      before: true,
      after: true,
      createdAt: true,
    },
  });

  console.log('ShippingZone UPDATE:');
  console.log(JSON.stringify(shippingLog, null, 2));
  console.log('');
  console.log('TaxConfig UPDATE:');
  console.log(JSON.stringify(taxLog, null, 2));
  console.log('');

  // ========================================
  // Side-by-side tables
  // ========================================
  console.log('='.repeat(120));
  console.log('SIDE-BY-SIDE TABLES (Golden A Full Path)');
  console.log('='.repeat(120));
  console.log('');

  console.log('TABLE 1A: Shipping fee 400→500 (VAT stays 0.20)');
  console.log('┌─────────────────────┬──────────────────────┬──────────────────────┐');
  console.log('│ Field               │ Before (fee 400)     │ After (fee 500)      │');
  console.log('├─────────────────────┼──────────────────────┼──────────────────────┤');
  console.log(`│ subtotalExVat       │ ${quote1a.subtotalExVat.padEnd(20)} │ ${quote1b.subtotalExVat.padEnd(20)} │`);
  console.log(`│ vatAmount           │ ${quote1a.vatAmount.padEnd(20)} │ ${quote1b.vatAmount.padEnd(20)} │`);
  console.log(`│ totalInclVat        │ ${quote1a.totalInclVat.padEnd(20)} │ ${quote1b.totalInclVat.padEnd(20)} │`);
  console.log('└─────────────────────┴──────────────────────┴──────────────────────┘');
  console.log('');

  console.log('TABLE 1B: VAT 0.20→0.18 (shipping stays 400)');
  console.log('┌─────────────────────┬──────────────────────┬──────────────────────┐');
  console.log('│ Field               │ Before (VAT 0.20)    │ After (VAT 0.18)     │');
  console.log('├─────────────────────┼──────────────────────┼──────────────────────┤');
  console.log(`│ subtotalExVat       │ ${quote2a.subtotalExVat.padEnd(20)} │ ${quote2b.subtotalExVat.padEnd(20)} │`);
  console.log(`│ vatAmount           │ ${quote2a.vatAmount.padEnd(20)} │ ${quote2b.vatAmount.padEnd(20)} │`);
  console.log(`│ totalInclVat        │ ${quote2a.totalInclVat.padEnd(20)} │ ${quote2b.totalInclVat.padEnd(20)} │`);
  console.log('└─────────────────────┴──────────────────────┴──────────────────────┘');
  console.log('');

  console.log('TABLE 2: COMBINED (fee 500 + VAT 0.18)');
  console.log('┌─────────────────────┬──────────────────────┬──────────────────────┐');
  console.log('│ Field               │ Baseline (400/0.20)  │ Combined (500/0.18)  │');
  console.log('├─────────────────────┼──────────────────────┼──────────────────────┤');
  console.log(`│ subtotalExVat       │ ${quote3a.subtotalExVat.padEnd(20)} │ ${quote3b.subtotalExVat.padEnd(20)} │`);
  console.log(`│ vatAmount           │ ${quote3a.vatAmount.padEnd(20)} │ ${quote3b.vatAmount.padEnd(20)} │`);
  console.log(`│ totalInclVat        │ ${quote3a.totalInclVat.padEnd(20)} │ ${quote3b.totalInclVat.padEnd(20)} │`);
  console.log('└─────────────────────┴──────────────────────┴──────────────────────┘');
  console.log('');

  // Restore seed values
  console.log('Restoring seed values (fee 400, VAT 0.20)...');
  await prisma.shippingZone.update({
    where: { id: kadikoyZone!.id },
    data: { fee: new Decimal(400) },
  });
  await prisma.taxConfig.update({
    where: { code: 'VAT_TR' },
    data: { vatRate: new Decimal(0.20) },
  });
  console.log('✓ Restored');
  console.log('');

  await prisma.$disconnect();
}

generateShippingTaxEvidence().catch(console.error);
