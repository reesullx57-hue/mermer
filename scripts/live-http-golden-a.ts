/**
 * Live HTTP call to POST /api/pricing/quote
 * Golden A configuration with real database IDs
 */

import { PrismaClient } from '@prisma/client';
import { POST } from '../src/app/api/pricing/quote/route';
import { NextRequest } from 'next/server';

const prisma = new PrismaClient();

async function liveHttpGoldenA() {
  console.log('🔍 Loading real database IDs for Golden A configuration...\n');

  // Load real IDs from database
  const [stoneColor, thickness, formType, edgeType] = await Promise.all([
    prisma.stoneColor.findFirst({
      where: { 
        code: 'WHITE',
        stone: { code: 'QUARTZ-001' },
        m2Price: 1680
      },
      include: { stone: true }
    }),
    prisma.thickness.findFirst({
      where: { cm: 3 }
    }),
    prisma.formType.findFirst({
      where: { code: 'L' }
    }),
    prisma.edgeType.findFirst({
      where: { code: 'RADIUS' }
    }),
  ]);

  if (!stoneColor || !thickness || !formType || !edgeType) {
    throw new Error('Required seed data not found in database');
  }

  console.log('✅ Database IDs resolved:');
  console.log(`  - stoneColorId: ${stoneColor.id} (${stoneColor.stone.nameTr} ${stoneColor.nameTr} - ${stoneColor.m2Price} TRY/m²)`);
  console.log(`  - thicknessId: ${thickness.id} (${thickness.cm} cm)`);
  console.log(`  - formTypeId: ${formType.id} (${formType.code})`);
  console.log(`  - edgeTypeId: ${edgeType.id} (${edgeType.code})`);
  console.log('');

  // Build Golden A request matching our Zod schema
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
    // dealerId omitted (no dealer)
  };

  console.log('📤 Request Body (Golden A configuration):');
  console.log(JSON.stringify(requestBody, null, 2));
  console.log('');

  console.log('🚀 Executing HTTP POST /api/pricing/quote...\n');

  // Create NextRequest and call the route handler
  const request = new NextRequest('http://localhost:3000/api/pricing/quote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  // Execute the request
  const response = await POST(request);
  const responseData = await response.json() as any;

  console.log('✅ HTTP Response Status:', response.status);
  console.log('');
  console.log('📥 FULL RAW JSON RESPONSE BODY:');
  console.log('='.repeat(80));
  console.log(JSON.stringify(responseData, null, 2));
  console.log('='.repeat(80));
  console.log('');

  // Verify key fields
  console.log('🔍 Verification:');
  console.log(`  - totalInclVat: ${responseData.totalInclVat} ${responseData.totalInclVat === '9809.98' ? '✅' : '❌'}`);
  console.log(`  - total (alias): ${responseData.total} ${responseData.total === '9809.98' ? '✅' : '❌'}`);
  console.log(`  - currency: ${responseData.currency}`);
  console.log(`  - stoneColorId in snapshot: ${responseData.pricingSnapshot?.stoneColorId === stoneColor.id ? '✅' : '❌'}`);
  console.log(`  - appliedDiscounts: ${JSON.stringify(responseData.pricingSnapshot?.appliedDiscounts)} ${Array.isArray(responseData.pricingSnapshot?.appliedDiscounts) && responseData.pricingSnapshot.appliedDiscounts.length === 0 ? '✅' : '❌'}`);
  console.log(`  - computedAt present: ${responseData.pricingSnapshot?.computedAt ? '✅' : '❌'}`);
  console.log(`  - wasteSource: ${responseData.pricingSnapshot?.wasteSource} ${responseData.pricingSnapshot?.wasteSource === 'global' ? '✅' : '❌'}`);
  console.log(`  - warnings: ${JSON.stringify(responseData.warnings)} ${Array.isArray(responseData.warnings) ? '✅' : '❌'}`);

  await prisma.$disconnect();
}

liveHttpGoldenA().catch(console.error);
