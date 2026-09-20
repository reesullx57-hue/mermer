/**
 * Test stone admin endpoints (F2 Gate 3)
 * Demonstrates live HTTP calls to stone management APIs
 */

const BASE_URL = 'http://localhost:3000';

async function testStonesEndpoints() {
  console.log('='.repeat(80));
  console.log('F2 Gate 3: Stones Admin API Test');
  console.log('='.repeat(80));
  console.log('');

  // Test 1: USER tries to GET stone-brands → 403
  console.log('1) USER GET /api/admin/stone-brands → 403 FORBIDDEN');
  console.log('-'.repeat(80));
  const res1 = await fetch(`${BASE_URL}/api/admin/stone-brands`, {
    headers: {
      'X-User-Id': 'user-123',
      'X-User-Role': 'USER',
    },
  });
  const data1 = await res1.json();
  console.log('Status:', res1.status);
  console.log('Response:', JSON.stringify(data1, null, 2));
  console.log('');

  // Test 2: ADMIN GET /api/admin/stone-brands → 200
  console.log('2) ADMIN GET /api/admin/stone-brands → 200 OK');
  console.log('-'.repeat(80));
  const res2 = await fetch(`${BASE_URL}/api/admin/stone-brands`, {
    headers: {
      'X-User-Id': 'admin-123',
      'X-User-Role': 'ADMIN',
    },
  });
  const data2 = await res2.json();
  console.log('Status:', res2.status);
  console.log('Response (first 2 brands):', JSON.stringify(data2.brands.slice(0, 2), null, 2));
  console.log('Total brands:', data2.brands.length);
  console.log('');

  // Test 3: ADMIN GET /api/admin/stone-colors → 200
  console.log('3) ADMIN GET /api/admin/stone-colors → 200 OK');
  console.log('-'.repeat(80));
  const res3 = await fetch(`${BASE_URL}/api/admin/stone-colors`, {
    headers: {
      'X-User-Id': 'admin-123',
      'X-User-Role': 'ADMIN',
    },
  });
  const data3 = await res3.json();
  console.log('Status:', res3.status);
  console.log('Response (first 2 colors):', JSON.stringify(data3.colors.slice(0, 2), null, 2));
  console.log('Total colors:', data3.colors.length);
  console.log('');

  // Test 4: USER tries to POST stone-colors → 403
  console.log('4) USER POST /api/admin/stone-colors → 403 FORBIDDEN');
  console.log('-'.repeat(80));
  const res4 = await fetch(`${BASE_URL}/api/admin/stone-colors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': 'user-123',
      'X-User-Role': 'USER',
    },
    body: JSON.stringify({
      stoneId: 'test-stone-id',
      code: 'TEST',
      nameTr: 'Test Color',
      m2Price: 1500,
    }),
  });
  const data4 = await res4.json();
  console.log('Status:', res4.status);
  console.log('Response:', JSON.stringify(data4, null, 2));
  console.log('');

  console.log('='.repeat(80));
  console.log('All tests complete');
  console.log('='.repeat(80));
}

// Run if script is executed directly
if (require.main === module) {
  testStonesEndpoints().catch(console.error);
}

export default testStonesEndpoints;
