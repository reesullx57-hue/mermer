/**
 * Seed script to create admin and test users
 * Run with: npx tsx scripts/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with admin and test users...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.local' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@demo.local',
      password: hashedPassword,
      name: 'Admin Kullanıcı',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:', {
    email: admin.email,
    role: admin.role,
    password: 'admin123',
  });

  // Create dealer user for testing
  const dealer = await prisma.user.upsert({
    where: { email: 'dealer@demo.local' },
    update: {
      password: hashedPassword,
      role: 'DEALER',
    },
    create: {
      email: 'dealer@demo.local',
      password: hashedPassword,
      name: 'Bayii Kullanıcı',
      role: 'DEALER',
    },
  });

  console.log('✅ Dealer user created:', {
    email: dealer.email,
    role: dealer.role,
    password: 'admin123',
  });

  // Create regular user for testing
  const user = await prisma.user.upsert({
    where: { email: 'user@demo.local' },
    update: {
      password: hashedPassword,
      role: 'USER',
    },
    create: {
      email: 'user@demo.local',
      password: hashedPassword,
      name: 'Normal Kullanıcı',
      role: 'USER',
    },
  });

  console.log('✅ Regular user created:', {
    email: user.email,
    role: user.role,
    password: 'admin123',
  });

  console.log('\n📋 Test Credentials:');
  console.log('==========================================');
  console.log('ADMIN:  admin@demo.local  / admin123');
  console.log('DEALER: dealer@demo.local / admin123');
  console.log('USER:   user@demo.local   / admin123');
  console.log('==========================================\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
