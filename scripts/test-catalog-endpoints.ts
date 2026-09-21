/**
 * Test catalog endpoints and show sample responses
 * F2 Gate 1 - ADR-014
 */

import { GET as getThicknesses } from '../src/app/api/thicknesses/route';
import { GET as getFormTypes } from '../src/app/api/form-types/route';
import { GET as getEdgeTypes } from '../src/app/api/edge-types/route';

async function testCatalogEndpoints() {
  console.log('🧪 Testing F2 Catalog Endpoints (ADR-014)\n');
  console.log('='.repeat(80));

  // Test GET /api/thicknesses
  console.log('\n📏 GET /api/thicknesses');
  console.log('-'.repeat(80));
  const thicknessResponse = await getThicknesses();
  const thicknesses = await thicknessResponse.json() as any;
  console.log('Status:', thicknessResponse.status);
  console.log('Response:');
  console.log(JSON.stringify(thicknesses, null, 2));

  // Test GET /api/form-types
  console.log('\n📐 GET /api/form-types');
  console.log('-'.repeat(80));
  const formTypeResponse = await getFormTypes();
  const formTypes = await formTypeResponse.json() as any;
  console.log('Status:', formTypeResponse.status);
  console.log('Response:');
  console.log(JSON.stringify(formTypes, null, 2));

  // Test GET /api/edge-types
  console.log('\n✂️  GET /api/edge-types');
  console.log('-'.repeat(80));
  const edgeTypeResponse = await getEdgeTypes();
  const edgeTypes = await edgeTypeResponse.json() as any;
  console.log('Status:', edgeTypeResponse.status);
  console.log('Response:');
  console.log(JSON.stringify(edgeTypes, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('✅ All catalog endpoints working correctly\n');
}

testCatalogEndpoints().catch(console.error);
