/**
 * Full integration test: Quote persistence + cache invalidation + immutable snapshots
 * F2 Gate 2 - HARD EVIDENCE for PO
 * 
 * This test demonstrates:
 * 1. Quote persisted with SINK_HOLE=300, total=9809.98
 * 2. Admin updates SINK_HOLE to 400 + writes AuditLog + invalidates cache
 * 3. New quote computes with SINK_HOLE=400, total=9929.98
 * 4. Old persisted quote snapshot remains unchanged (immutable)
 */

import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { computeQuote, invalidatePricingCache } from './index';
import type { ConfigurationInput } from './schemas';

const prisma = new PrismaClient();

describe('Full Integration: Quote Persistence + Cache Invalidation (F2 Gate 2)', () => {
  let testInput: ConfigurationInput;
  let stoneColorId: string;
  let thicknessId: string;
  let formTypeId: string;
  let edgeTypeId: string;
  let testAdminId: string;

  beforeAll(async () => {
    // Create test admin user
    const admin = await prisma.user.upsert({
      where: { email: 'test-admin-integration@example.com' },
      update: {},
      create: {
        email: 'test-admin-integration@example.com',
        passwordHash: 'test-hash',
        role: 'ADMIN',
      },
    });
    testAdminId = admin.id;

    // Find seed data IDs
    const stoneColor = await prisma.stoneColor.findFirst({
      where: { code: 'WHITE', stone: { code: 'QUARTZ-001' } },
    });
    const thickness = await prisma.thickness.findFirst({
      where: { cm: 3 },
    });
    const formType = await prisma.formType.findFirst({
      where: { code: 'L' },
    });
    const edgeType = await prisma.edgeType.findFirst({
      where: { code: 'RADIUS' },
    });

    if (!stoneColor || !thickness || !formType || !edgeType) {
      throw new Error('Seed data not found');
    }

    stoneColorId = stoneColor.id;
    thicknessId = thickness.id;
    formTypeId = formType.id;
    edgeTypeId = edgeType.id;

    // Golden A configuration
    testInput = {
      stoneColorId,
      thicknessId,
      formTypeId,
      edgeTypeId,
      dimensions: {
        formType: 'L',
        leg1: 320,
        leg2: 180,
        depth: 65,
      },
      sink: {
        type: 'undermount',
        holes: 1,
      },
      cooktopHole: true,
      install: true,
      skirting: {
        enabled: false,
      },
      trim: {
        enabled: false,
      },
      panelled: false,
      sideBox: {
        enabled: false,
      },
      address: {
        city: 'İstanbul',
        district: 'Kadıköy',
      },
    };
  });

  it('FULL INTEGRATION: persist quote → update rule → verify immutability', async () => {
    console.log('\n='.repeat(80));
    console.log('FULL INTEGRATION TEST - F2 Gate 2');
    console.log('='.repeat(80));

    // ===== STEP A: Compute and persist Quote with SINK_HOLE=300 =====
    console.log('\n[STEP A] Computing quote with SINK_HOLE = 300...');
    const snapshot1 = await computeQuote(testInput);
    const sinkLine1 = snapshot1.lines.find((l) => l.code === 'SINK_HOLE');
    
    expect(sinkLine1?.unitPrice).toBe('300.00');
    expect(snapshot1.totalInclVat).toBe('9809.98');
    
    console.log('  ✓ SINK_HOLE unitPrice:', sinkLine1?.unitPrice);
    console.log('  ✓ Total incl VAT:', snapshot1.totalInclVat);

    // Create Configuration (required FK for Quote)
    const config = await prisma.configuration.create({
      data: {
        stoneColorId,
        thicknessId,
        formTypeId,
        edgeTypeId,
        dimensions: testInput.dimensions as any,
        sinkHoles: 1,
        cooktopHole: true,
      },
    });

    // Persist Quote with snapshot
    const savedQuote = await prisma.quote.create({
      data: {
        configurationId: config.id,
        userId: testAdminId,
        subtotalExVat: new Decimal(snapshot1.subtotalExVat),
        vatAmount: new Decimal(snapshot1.vatAmount),
        totalInclVat: new Decimal(snapshot1.totalInclVat),
        pricingSnapshot: snapshot1 as any,
      },
    });

    console.log('\n  ✓ Quote persisted with ID:', savedQuote.id);
    console.log('  ✓ pricingSnapshot stored in DB');

    // ===== STEP B: Admin updates SINK_HOLE to 400 =====
    console.log('\n[STEP B] Admin updating SINK_HOLE: 300 → 400...');
    
    const sinkHoleRule = await prisma.priceRule.findUnique({
      where: { code: 'SINK_HOLE' },
    });
    const originalValue = sinkHoleRule!.value;

    // Update rule
    await prisma.priceRule.update({
      where: { code: 'SINK_HOLE' },
      data: { value: 400 },
    });

    // Write audit log (simulating admin route)
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: testAdminId,
        action: 'UPDATE',
        entityType: 'PriceRule',
        entityId: sinkHoleRule!.id,
        before: {
          code: 'SINK_HOLE',
          value: originalValue.toString(),
        },
        after: {
          code: 'SINK_HOLE',
          value: '400',
        },
      },
    });

    console.log('  ✓ SINK_HOLE updated to 400');
    console.log('  ✓ AuditLog created:', auditLog.id);

    // Invalidate cache
    await invalidatePricingCache();
    console.log('  ✓ Cache invalidated');

    // ===== STEP C: Compute new quote with updated price =====
    console.log('\n[STEP C] Computing new quote with SINK_HOLE = 400...');
    const snapshot2 = await computeQuote(testInput);
    const sinkLine2 = snapshot2.lines.find((l) => l.code === 'SINK_HOLE');

    expect(sinkLine2?.unitPrice).toBe('400.00');
    expect(snapshot2.subtotalExVat).toBe('8274.98');
    expect(snapshot2.vatAmount).toBe('1655.00');
    expect(snapshot2.totalInclVat).toBe('9929.98');

    console.log('  ✓ SINK_HOLE unitPrice:', sinkLine2?.unitPrice);
    console.log('  ✓ Subtotal ex VAT:', snapshot2.subtotalExVat);
    console.log('  ✓ VAT amount:', snapshot2.vatAmount);
    console.log('  ✓ Total incl VAT:', snapshot2.totalInclVat);

    // ===== STEP D: Verify old quote snapshot is IMMUTABLE =====
    console.log('\n[STEP D] Verifying persisted quote snapshot is IMMUTABLE...');
    const fetchedQuote = await prisma.quote.findUnique({
      where: { id: savedQuote.id },
    });

    const oldSnapshot = fetchedQuote!.pricingSnapshot as any;
    const oldSinkLine = oldSnapshot.lines.find((l: any) => l.code === 'SINK_HOLE');

    expect(oldSinkLine.unitPrice).toBe('300.00');
    expect(oldSnapshot.totalInclVat).toBe('9809.98');

    console.log('  ✓ Old quote fetched from DB');
    console.log('  ✓ Old snapshot SINK_HOLE:', oldSinkLine.unitPrice);
    console.log('  ✓ Old snapshot total:', oldSnapshot.totalInclVat);

    // ===== SIDE-BY-SIDE COMPARISON =====
    console.log('\n' + '='.repeat(80));
    console.log('SIDE-BY-SIDE COMPARISON:');
    console.log('='.repeat(80));
    console.log('│ Metric                │ Old Persisted Quote │ New Quote (Post-Update) │');
    console.log('├───────────────────────┼─────────────────────┼─────────────────────────┤');
    console.log(`│ SINK_HOLE unitPrice   │      ${oldSinkLine.unitPrice}       │         ${sinkLine2?.unitPrice}        │`);
    console.log(`│ Total incl VAT        │     ${oldSnapshot.totalInclVat}     │        ${snapshot2.totalInclVat}       │`);
    console.log('└───────────────────────┴─────────────────────┴─────────────────────────┘');
    console.log('\n✅ IMMUTABILITY VERIFIED: Old quote snapshot unchanged despite rule update');
    console.log('='.repeat(80));

    // Query latest audit log for evidence
    const latestAudit = await prisma.auditLog.findFirst({
      where: {
        entityType: 'PriceRule',
        action: 'UPDATE',
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('\n[AUDIT LOG EVIDENCE]');
    console.log('Latest PriceRule UPDATE audit log:');
    console.log(JSON.stringify({
      id: latestAudit!.id,
      userId: latestAudit!.userId,
      action: latestAudit!.action,
      entityType: latestAudit!.entityType,
      before: latestAudit!.before,
      after: latestAudit!.after,
      createdAt: latestAudit!.createdAt.toISOString(),
    }, null, 2));

    // Cleanup
    await prisma.quote.delete({ where: { id: savedQuote.id } });
    await prisma.configuration.delete({ where: { id: config.id } });
    
    // Restore original SINK_HOLE value
    await prisma.priceRule.update({
      where: { code: 'SINK_HOLE' },
      data: { value: originalValue },
    });
    await invalidatePricingCache();
    
    console.log('\n✓ Test cleanup complete');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
