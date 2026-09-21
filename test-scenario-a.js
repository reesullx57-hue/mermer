#!/usr/bin/env node

// Test Scenario A: L 320/180/65, radius, 3cm, Quartz White, sink undermount holes=1, cooktop, install, İstanbul/Kadıköy
// Expected: totalInclVat = 9809.98

const scenarioA = {
  stoneColorId: 'cmu9t6lau000o8m8hf38wp4xp', // Quartz White
  thicknessId: 'cmu9t6lb0001d8m8h18u3kmvi', // 3cm
  formTypeId: 'cmu9t6lb3001g8m8h5p95hmsc', // L
  edgeTypeId: 'cmu9t6lb8001k8m8hoou2xgs8', // Radius
  dimensions: {
    formType: 'L',
    leg1: 320,
    leg2: 180,
    depth: 65,
  },
  sinkHoles: 1,
  cooktopHole: true,
  install: true,
  skirtingEnabled: false,
  trimEnabled: false,
  address: {
    city: 'İstanbul',
    district: 'Kadıköy',
  },
};

async function testScenarioA() {
  console.log('Testing Scenario A...\n');
  console.log('Request:', JSON.stringify(scenarioA, null, 2), '\n');

  try {
    const response = await fetch('http://localhost:3000/api/pricing/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scenarioA),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error:', JSON.stringify(error, null, 2));
      process.exit(1);
    }

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2), '\n');

    const totalInclVat = parseFloat(data.totalInclVat);
    const expected = 9809.98;

    console.log(`Total (incl VAT): ${totalInclVat}`);
    console.log(`Expected: ${expected}`);
    console.log(`Match: ${totalInclVat === expected ? '✅ YES' : '❌ NO'}`);

    if (totalInclVat !== expected) {
      console.error(`\n❌ Test failed! Expected ${expected}, got ${totalInclVat}`);
      process.exit(1);
    }

    console.log('\n✅ Test passed! Scenario A = 9809.98');
  } catch (error) {
    console.error('Request failed:', error);
    process.exit(1);
  }
}

testScenarioA();
