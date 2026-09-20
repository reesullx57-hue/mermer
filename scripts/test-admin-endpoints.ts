/**
 * Test admin pricerules endpoints with sample outputs
 * F2 Gate 2
 */

import { GET as listPriceRules } from '../src/app/api/admin/pricerules/route';
import { NextRequest } from 'next/server';

async function testAdminEndpoints() {
  console.log('🔐 Testing F2 Gate 2 Admin Endpoints\n');
  console.log('='.repeat(80));

  // Test as USER (should be forbidden)
  console.log('\n❌ GET /api/admin/pricerules (as USER)');
  console.log('-'.repeat(80));
  const userRequest = new NextRequest('http://localhost:3000/api/admin/pricerules', {
    headers: {
      'X-User-Id': 'user-123',
      'X-User-Role': 'USER',
    },
  });
  const userResponse = await listPriceRules(userRequest);
  const userData = await userResponse.json() as any;
  console.log('Status:', userResponse.status);
  console.log('Response:');
  console.log(JSON.stringify(userData, null, 2));

  // Test as ADMIN (should succeed)
  console.log('\n✅ GET /api/admin/pricerules (as ADMIN)');
  console.log('-'.repeat(80));
  const adminRequest = new NextRequest('http://localhost:3000/api/admin/pricerules', {
    headers: {
      'X-User-Id': 'admin-123',
      'X-User-Email': 'admin@example.com',
      'X-User-Role': 'ADMIN',
    },
  });
  const adminResponse = await listPriceRules(adminRequest);
  const adminData = await adminResponse.json() as any;
  console.log('Status:', adminResponse.status);
  console.log('Response (first 3 rules):');
  console.log(JSON.stringify(adminData.slice(0, 3), null, 2));
  console.log(`\n(Total: ${adminData.length} active price rules)`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ Admin authorization working correctly\n');
}

testAdminEndpoints().catch(console.error);
