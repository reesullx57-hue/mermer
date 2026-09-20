/**
 * Add SKIRTING and TRIM price rules to existing database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSkirtingTrim() {
  console.log('Adding SKIRTING and TRIM price rules...\n');

  // Check if they already exist
  const existing = await prisma.priceRule.findMany({
    where: {
      code: {
        in: ['SKIRTING', 'TRIM'],
      },
    },
  });

  console.log('Existing rules:', existing.map(r => r.code));

  if (existing.length === 0) {
    // Add both
    await prisma.priceRule.createMany({
      data: [
        {
          code: 'SKIRTING',
          nameTr: 'Süpürgelik',
          value: 150.00,
          unit: 'TRY_PER_METER',
          isActive: true,
        },
        {
          code: 'TRIM',
          nameTr: 'Profil',
          value: 100.00,
          unit: 'TRY_PER_METER',
          isActive: true,
        },
      ],
    });
    console.log('✅ Added SKIRTING and TRIM price rules');
  } else {
    // Update existing
    for (const rule of existing) {
      const value = rule.code === 'SKIRTING' ? 150.00 : 100.00;
      await prisma.priceRule.update({
        where: { id: rule.id },
        data: { value, unit: 'TRY_PER_METER', isActive: true },
      });
      console.log(`✅ Updated ${rule.code} price rule`);
    }
  }

  // Verify
  const rules = await prisma.priceRule.findMany({
    where: {
      code: {
        in: ['SKIRTING', 'TRIM'],
      },
    },
  });

  console.log('\n📋 Final SKIRTING/TRIM rules:');
  rules.forEach(r => {
    console.log(`  ${r.code}: ${r.value} ${r.unit}`);
  });

  await prisma.$disconnect();
}

addSkirtingTrim().catch(console.error);
