import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';
import { computeQuote } from '../src/modules/pricing';
import type { ConfigurationInput } from '../src/modules/pricing/schemas';

const prisma = new PrismaClient();

async function main() {
  const stoneColor = await prisma.stoneColor.findFirst({
    where: { m2Price: new Decimal(1680), isActive: true },
  });
  const thickness = await prisma.thickness.findFirst({ where: { cm: 3 } });
  const formType = await prisma.formType.findFirst({ where: { code: 'L' } });
  const edgeType = await prisma.edgeType.findFirst({ where: { code: 'RADIUS' } });

  await prisma.thickness.update({
    where: { id: thickness!.id },
    data: { coefficient: new Decimal(1.10) },
  });

  const config: ConfigurationInput = {
    stoneColorId: stoneColor!.id,
    thicknessId: thickness!.id,
    formTypeId: formType!.id,
    edgeTypeId: edgeType!.id,
    dimensions: { formType: 'L', leg1: 320, leg2: 180, depth: 65 },
    sink: null,
    cooktopHole: false,
    install: false,
    panelled: false,
  };

  const quote1 = await computeQuote(config);
  console.log('Old snapshot coefficients:');
  console.log(JSON.stringify(quote1.coefficients));

  await prisma.thickness.update({
    where: { id: thickness!.id },
    data: { coefficient: new Decimal(1.20) },
  });

  const quote2 = await computeQuote(config);
  console.log('\\nNew snapshot coefficients:');
  console.log(JSON.stringify(quote2.coefficients));

  await prisma.thickness.update({
    where: { id: thickness!.id },
    data: { coefficient: new Decimal(1.10) },
  });

  await prisma.$disconnect();
}

main().catch(console.error);
