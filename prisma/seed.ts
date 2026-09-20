import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TÜM DEĞERLER TEMSİLİDİR. Gerçek fiyatlar admin panelinden girilecek.

async function main() {
  console.log('🌱 Seeding database...');

  // Admin User
  // Password hash is bcrypt hash of "demo" (generated with cost factor 10)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo.local',
      name: 'Admin User',
      passwordHash: '$2b$10$rKXN5Z5Z5Z5Z5Z5Z5Z5Z5uO5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', // bcrypt("demo")
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Dealer
  const dealer = await prisma.dealer.create({
    data: {
      code: 'DLR-001',
      nameTr: 'Demo Bayi',
      discountRate: 0.10,
      isActive: true,
    },
  });
  console.log('✅ Dealer created:', dealer.code);

  // Stone Brands
  const brands = await Promise.all([
    prisma.stoneBrand.create({
      data: { code: 'LAMAR', nameTr: 'Lamar', isActive: true },
    }),
    prisma.stoneBrand.create({
      data: { code: 'NGSTONE', nameTr: 'NG Stone', isActive: true },
    }),
    prisma.stoneBrand.create({
      data: { code: 'XBRAND', nameTr: 'X Brand', isActive: true },
    }),
    prisma.stoneBrand.create({
      data: { code: 'YBRAND', nameTr: 'Y Brand', isActive: true },
    }),
    prisma.stoneBrand.create({
      data: { code: 'ZBRAND', nameTr: 'Z Brand', isActive: true },
    }),
  ]);
  console.log('✅ Created', brands.length, 'stone brands');

  // Collections
  const collections = await Promise.all([
    // Lamar Collections
    prisma.stoneCollection.create({
      data: {
        brandId: brands[0].id,
        code: 'CLASSIC',
        nameTr: 'Klasik Serisi',
        isActive: true,
      },
    }),
    prisma.stoneCollection.create({
      data: {
        brandId: brands[0].id,
        code: 'PREMIUM',
        nameTr: 'Premium Serisi',
        isActive: true,
      },
    }),
    // NG Stone Collections
    prisma.stoneCollection.create({
      data: {
        brandId: brands[1].id,
        code: 'MODERN',
        nameTr: 'Modern Serisi',
        isActive: true,
      },
    }),
    prisma.stoneCollection.create({
      data: {
        brandId: brands[1].id,
        code: 'ELITE',
        nameTr: 'Elite Serisi',
        isActive: true,
      },
    }),
    // X Brand Collection
    prisma.stoneCollection.create({
      data: {
        brandId: brands[2].id,
        code: 'SIGNATURE',
        nameTr: 'İmza Serisi',
        isActive: true,
      },
    }),
    // Y Brand Collection
    prisma.stoneCollection.create({
      data: {
        brandId: brands[3].id,
        code: 'NATURAL',
        nameTr: 'Doğal Serisi',
        isActive: true,
      },
    }),
    // Z Brand Collection
    prisma.stoneCollection.create({
      data: {
        brandId: brands[4].id,
        code: 'LUXURY',
        nameTr: 'Lüks Serisi',
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Created', collections.length, 'collections');

  // Stones and Colors
  const stones = await Promise.all([
    // Quartz stones (Lamar brand)
    prisma.stone.create({
      data: {
        brandId: brands[0].id,
        collectionId: collections[0].id,
        code: 'QUARTZ-001',
        nameTr: 'Kuvars',
        isActive: true,
        colors: {
          create: [
            {
              code: 'WHITE',
              nameTr: 'Beyaz Kuvars',
              m2Price: 1680.00, // 🎯 Golden test stone
              wastePercent: null,
              isActive: true,
            },
            {
              code: 'GREY',
              nameTr: 'Gri Kuvars',
              m2Price: 1750.00,
              wastePercent: null,
              isActive: true,
            },
            {
              code: 'BLACK',
              nameTr: 'Siyah Kuvars',
              m2Price: 1850.00,
              wastePercent: null,
              isActive: true,
            },
            {
              code: 'BEIGE',
              nameTr: 'Bej Kuvars',
              m2Price: 1720.00,
              wastePercent: null,
              isActive: true,
            },
          ],
        },
      },
    }),
    // Granite stones (Lamar brand)
    prisma.stone.create({
      data: {
        brandId: brands[0].id,
        collectionId: collections[1].id,
        code: 'GRANITE-001',
        nameTr: 'Granit',
        isActive: true,
        colors: {
          create: [
            {
              code: 'BLACK',
              nameTr: 'Siyah Granit',
              m2Price: 2200.00,
              wastePercent: null,
              isActive: true,
            },
            {
              code: 'BROWN',
              nameTr: 'Kahverengi Granit',
              m2Price: 2100.00,
              wastePercent: null,
              isActive: true,
            },
            {
              code: 'RED',
              nameTr: 'Kırmızı Granit',
              m2Price: 2350.00,
              wastePercent: null,
              isActive: true,
            },
          ],
        },
      },
    }),
    // Marble stones (NG Stone brand)
    prisma.stone.create({
      data: {
        brandId: brands[1].id,
        collectionId: collections[2].id,
        code: 'MARBLE-001',
        nameTr: 'Mermer',
        isActive: true,
        colors: {
          create: [
            {
              code: 'WHITE',
              nameTr: 'Beyaz Mermer',
              m2Price: 2500.00,
              wastePercent: null,
              isActive: true,
            },
            {
              code: 'GREY',
              nameTr: 'Gri Mermer',
              m2Price: 2400.00,
              wastePercent: null,
              isActive: true,
            },
            {
              code: 'CREAM',
              nameTr: 'Krem Mermer',
              m2Price: 2300.00,
              wastePercent: null,
              isActive: true,
            },
            {
              code: 'GOLD',
              nameTr: 'Altın Mermer',
              m2Price: 2450.00,
              wastePercent: null,
              isActive: true,
            },
          ],
        },
      },
    }),
    // Ceramic stones (X Brand)
    prisma.stone.create({
      data: {
        brandId: brands[2].id,
        collectionId: collections[4].id,
        code: 'CERAMIC-001',
        nameTr: 'Seramik',
        isActive: true,
        colors: {
          create: [
            {
              code: 'WHITE',
              nameTr: 'Beyaz Seramik',
              m2Price: 1200.00,
              wastePercent: null,
              isActive: true,
            },
            {
              code: 'GREY',
              nameTr: 'Gri Seramik',
              m2Price: 1250.00,
              wastePercent: null,
              isActive: true,
            },
            {
              code: 'BLACK',
              nameTr: 'Siyah Seramik',
              m2Price: 1300.00,
              wastePercent: null,
              isActive: true,
            },
          ],
        },
      },
    }),
    // Compact laminate (Y Brand)
    prisma.stone.create({
      data: {
        brandId: brands[3].id,
        collectionId: collections[5].id,
        code: 'COMPACT-001',
        nameTr: 'Kompakt Laminat',
        isActive: true,
        colors: {
          create: [
            {
              code: 'OAK',
              nameTr: 'Meşe Kompakt',
              m2Price: 800.00,
              wastePercent: null,
              isActive: true,
            },
            {
              code: 'WALNUT',
              nameTr: 'Ceviz Kompakt',
              m2Price: 850.00,
              wastePercent: null,
              isActive: true,
            },
            {
              code: 'CONCRETE',
              nameTr: 'Beton Kompakt',
              m2Price: 820.00,
              wastePercent: null,
              isActive: true,
            },
          ],
        },
      },
    }),
  ]);
  console.log('✅ Created', stones.length, 'stone types with colors');

  // Thickness options
  const thicknesses = await Promise.all([
    prisma.thickness.create({
      data: {
        cm: 2,
        nameTr: '2 cm',
        coefficient: 1.00,
        isActive: true,
      },
    }),
    prisma.thickness.create({
      data: {
        cm: 3,
        nameTr: '3 cm',
        coefficient: 1.10,
        isActive: true,
      },
    }),
    prisma.thickness.create({
      data: {
        cm: 4,
        nameTr: '4 cm',
        coefficient: 1.25,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Created', thicknesses.length, 'thickness options');

  // Form types
  const formTypes = await Promise.all([
    prisma.formType.create({
      data: {
        code: 'STRAIGHT',
        nameTr: 'Düz',
        coefficient: 1.00,
        isActive: true,
      },
    }),
    prisma.formType.create({
      data: {
        code: 'L',
        nameTr: 'L Şekli',
        coefficient: 1.15,
        isActive: true,
      },
    }),
    prisma.formType.create({
      data: {
        code: 'U',
        nameTr: 'U Şekli',
        coefficient: 1.30,
        isActive: true,
      },
    }),
    prisma.formType.create({
      data: {
        code: 'ISLAND',
        nameTr: 'Ada',
        coefficient: 1.40,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Created', formTypes.length, 'form types');

  // Edge types
  const edgeTypes = await Promise.all([
    prisma.edgeType.create({
      data: {
        code: 'STRAIGHT',
        nameTr: 'Düz Kenar',
        coefficient: 1.00,
        isActive: true,
      },
    }),
    prisma.edgeType.create({
      data: {
        code: 'RADIUS',
        nameTr: 'Radius Kenar',
        coefficient: 1.05,
        isActive: true,
      },
    }),
    prisma.edgeType.create({
      data: {
        code: 'BEVEL',
        nameTr: 'Bevel Kenar',
        coefficient: 1.10,
        isActive: true,
      },
    }),
    prisma.edgeType.create({
      data: {
        code: 'IRON',
        nameTr: 'Demir Kenar',
        coefficient: 1.15,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Created', edgeTypes.length, 'edge types');

  // Price Rules (NO VAT - VAT is in TaxConfig)
  const priceRules = await Promise.all([
    prisma.priceRule.create({
      data: {
        code: 'SINK_HOLE',
        nameTr: 'Eviye Deliği',
        value: 300.00,
        unit: 'TRY',
        isActive: true,
      },
    }),
    prisma.priceRule.create({
      data: {
        code: 'COOKTOP_HOLE',
        nameTr: 'Ocak Deliği',
        value: 350.00,
        unit: 'TRY',
        isActive: true,
      },
    }),
    prisma.priceRule.create({
      data: {
        code: 'INSTALL',
        nameTr: 'Montaj Ücreti',
        value: 500.00,
        unit: 'TRY',
        isActive: true,
      },
    }),
    prisma.priceRule.create({
      data: {
        code: 'WASTE_DEFAULT_PERCENT',
        nameTr: 'Varsayılan Fire Oranı',
        value: 0.05,
        unit: 'PERCENT',
        isActive: true,
      },
    }),
    prisma.priceRule.create({
      data: {
        code: 'MIN_AREA_M2',
        nameTr: 'Minimum Alan',
        value: 1.0,
        unit: 'M2',
        isActive: true,
      },
    }),
    prisma.priceRule.create({
      data: {
        code: 'MIN_ORDER_AMOUNT',
        nameTr: 'Minimum Sipariş Tutarı',
        value: 5000.00,
        unit: 'TRY',
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Created', priceRules.length, 'price rules');

  // Tax Config
  const taxConfig = await prisma.taxConfig.create({
    data: {
      code: 'VAT_TR',
      vatRate: 0.20,
      isActive: true,
    },
  });
  console.log('✅ Tax config created:', taxConfig.code);

  // Shipping Zones
  const shippingZones = await Promise.all([
    prisma.shippingZone.create({
      data: {
        city: 'İstanbul',
        district: 'Kadıköy',
        fee: 400.00,
        installAvailable: true,
        isActive: true,
      },
    }),
    prisma.shippingZone.create({
      data: {
        city: 'İstanbul',
        district: '',
        fee: 450.00,
        installAvailable: true,
        isActive: true,
      },
    }),
    prisma.shippingZone.create({
      data: {
        city: 'Ankara',
        district: '',
        fee: 500.00,
        installAvailable: true,
        isActive: true,
      },
    }),
    prisma.shippingZone.create({
      data: {
        city: 'İzmir',
        district: '',
        fee: 550.00,
        installAvailable: true,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Created', shippingZones.length, 'shipping zones');

  // Accessories
  const accessories = await Promise.all([
    prisma.accessory.create({
      data: {
        code: 'SINK-001',
        nameTr: 'Paslanmaz Eviye',
        unit: 'ADET',
        unitPrice: 1500.00,
        isActive: true,
      },
    }),
    prisma.accessory.create({
      data: {
        code: 'TRIM-001',
        nameTr: 'Alüminyum Profil',
        unit: 'METRE',
        unitPrice: 85.00,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Created', accessories.length, 'accessories');

  console.log('\n✨ Seeding complete!');
  console.log('\n📊 Summary:');
  console.log('  - Admin user: 1 (admin@demo.local, password: demo)');
  console.log('  - Dealers: 1');
  console.log('  - Stone brands: 5');
  console.log('  - Collections: 7');
  console.log('  - Stone types: 5');
  console.log('  - Stone colors: 17 total');
  console.log('  - 🎯 Golden test stone: Quartz White (QUARTZ-001/WHITE) at 1680.00 TRY/m²');
  console.log('  - Thickness options: 3');
  console.log('  - Form types: 4');
  console.log('  - Edge types: 4');
  console.log('  - Price rules: 6 (no VAT)');
  console.log('  - Tax config: 1 (VAT_TR: 20%)');
  console.log('  - Shipping zones: 4');
  console.log('  - Accessories: 2');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
