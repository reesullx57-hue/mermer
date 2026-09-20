#!/bin/bash
# F2 Gate 5 Evidence #5: Test count breakdown
# Expected: 106→118 (+12 tests)

echo "=========================================="
echo "Test Count Breakdown by Category"
echo "=========================================="
echo ""

echo "Geometry Module:"
npm test -- src/modules/geometry 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Pricing Module (unit tests):"
npm test -- src/modules/pricing/index.test.ts 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Pricing Module (cache invalidation - PriceRule):"
npm test -- src/modules/pricing/cache-invalidation.test.ts 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Pricing Module (cache invalidation tags unit):"
npm test -- src/modules/pricing/cache-invalidation-tags.test.ts 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Pricing Module (full integration):"
npm test -- src/modules/pricing/full-integration.test.ts 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Pricing Module (stones cache invalidation):"
npm test -- src/modules/pricing/stones-cache-invalidation.test.ts 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Pricing Module (catalog cache invalidation):"
npm test -- src/modules/pricing/catalog-cache-invalidation.test.ts 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Pricing Module (shipping+tax cache invalidation) - NEW F2 Gate 5:"
npm test -- src/modules/pricing/shipping-tax-cache-invalidation.test.ts 2>&1 | grep "Tests:" | tail -1
echo ""

echo "API Quote Route:"
npm test -- src/app/api/pricing/quote/route.test.ts 2>&1 | grep "Tests:" | tail -1
echo ""

echo "API Catalog Endpoints (thicknesses, form-types, edge-types):"
npm test -- "src/app/api/(thicknesses|form-types|edge-types)" 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Admin API - PriceRules:"
npm test -- src/app/api/admin/pricerules 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Admin API - Stone Brands:"
npm test -- src/app/api/admin/stone-brands 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Admin API - Stone Collections:"
npm test -- src/app/api/admin/stone-collections 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Admin API - Stones:"
npm test -- src/app/api/admin/stones 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Admin API - Stone Colors:"
npm test -- src/app/api/admin/stone-colors 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Admin API - Thicknesses:"
npm test -- src/app/api/admin/thicknesses 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Admin API - Form Types:"
npm test -- src/app/api/admin/form-types 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Admin API - Edge Types:"
npm test -- src/app/api/admin/edge-types 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Admin API - Shipping Zones - NEW F2 Gate 5:"
npm test -- src/app/api/admin/shipping-zones 2>&1 | grep "Tests:" | tail -1
echo ""

echo "Admin API - Tax Configs - NEW F2 Gate 5:"
npm test -- src/app/api/admin/tax-configs 2>&1 | grep "Tests:" | tail -1
echo ""

echo "=========================================="
echo "Overall:"
npm test 2>&1 | grep "Tests:" | tail -1
echo "=========================================="
