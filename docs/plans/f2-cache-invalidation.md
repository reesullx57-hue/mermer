# F2 Cache Invalidation Plan

## Overview
When admin updates pricing rules via `/admin/price-rules`, cached quotes must be invalidated so new quote requests reflect updated prices. Historical quote snapshots remain unchanged.

## Goal
Ensure `invalidatePricingCache()` is called on price rule mutations and verify new quotes use updated prices while persisted quotes preserve their original snapshots.

## Implementation Steps

### 1. Admin Price Rule CRUD (F2 Gate 2+)
**Routes:**
- `POST /admin/price-rules` - Create new rule
- `PUT /admin/price-rules/:id` - Update existing rule
- `DELETE /admin/price-rules/:id` - Soft-delete (set isActive=false)

**Middleware:**
- Auth guard: verify `user.role === 'ADMIN'` (ADR-015)
- Return 403 if not admin

**Cache Invalidation:**
After successful mutation (within transaction commit):
```typescript
await prisma.priceRule.update({ ... });
await invalidatePricingCache(); // Clear all pricing:v1:* tags
```

### 2. Quote Persistence (F2 Gate 3+)
When a quote is computed and saved:
```typescript
const snapshot = await computeQuote(input);
const savedQuote = await prisma.quote.create({
  data: {
    ...
    pricingSnapshot: snapshot, // JSON field
  }
});
```

**Immutability:** Once saved, `pricingSnapshot` never changes. It reflects the pricing rules at the time of computation.

### 3. Cache Invalidation Integration Test

**Test Scenario:**
1. Initial state: SINK_HOLE = 300 TRY
2. Compute quote → verify sink hole line unitPrice = "300.00"
3. Admin updates: SINK_HOLE → 400 TRY (via Prisma, simulating admin route)
4. Call `invalidatePricingCache()`
5. Compute new quote → verify sink hole line unitPrice = "400.00"
6. If Quote row exists with old snapshot → verify its snapshot still contains "300.00"

**Test File:** `src/modules/pricing/cache-invalidation.test.ts` (stub below)

```typescript
describe('Pricing Cache Invalidation', () => {
  it.skip('invalidates cache when price rule is updated', async () => {
    // Step 1: Initial quote with SINK_HOLE = 300
    const input = { /* ... golden A config with sink */ };
    const quote1 = await computeQuote(input);
    const sinkLine1 = quote1.lines.find(l => l.code === 'SINK_HOLE');
    expect(sinkLine1?.unitPrice).toBe('300.00');

    // Step 2: Update SINK_HOLE rule to 400
    await prisma.priceRule.update({
      where: { code: 'SINK_HOLE' },
      data: { value: 400 }
    });

    // Step 3: Invalidate cache
    await invalidatePricingCache();

    // Step 4: New quote should reflect updated price
    const quote2 = await computeQuote(input);
    const sinkLine2 = quote2.lines.find(l => l.code === 'SINK_HOLE');
    expect(sinkLine2?.unitPrice).toBe('400.00');

    // Step 5: Restore original value for other tests
    await prisma.priceRule.update({
      where: { code: 'SINK_HOLE' },
      data: { value: 300 }
    });
    await invalidatePricingCache();
  });

  it.skip('preserves historical quote snapshots after rule change', async () => {
    // Step 1: Save quote with SINK_HOLE = 300
    const input = { /* ... */ };
    const snapshot1 = await computeQuote(input);
    const savedQuote = await prisma.quote.create({
      data: {
        userId: 'test-user-id',
        configurationJson: input,
        pricingSnapshot: snapshot1,
        totalInclVat: new Decimal(snapshot1.totalInclVat),
      }
    });

    // Step 2: Update SINK_HOLE to 400
    await prisma.priceRule.update({
      where: { code: 'SINK_HOLE' },
      data: { value: 400 }
    });
    await invalidatePricingCache();

    // Step 3: Verify saved quote snapshot unchanged
    const fetchedQuote = await prisma.quote.findUnique({
      where: { id: savedQuote.id }
    });
    const oldSinkLine = fetchedQuote!.pricingSnapshot.lines.find(
      (l: any) => l.code === 'SINK_HOLE'
    );
    expect(oldSinkLine.unitPrice).toBe('300.00'); // Historical snapshot preserved

    // Step 4: New quote uses updated price
    const quote2 = await computeQuote(input);
    const newSinkLine = quote2.lines.find(l => l.code === 'SINK_HOLE');
    expect(newSinkLine?.unitPrice).toBe('400.00');

    // Cleanup
    await prisma.quote.delete({ where: { id: savedQuote.id } });
    await prisma.priceRule.update({
      where: { code: 'SINK_HOLE' },
      data: { value: 300 }
    });
    await invalidatePricingCache();
  });
});
```

## Cache Tags Strategy

**Current Implementation:**
`invalidatePricingCache()` is a placeholder in `src/modules/pricing/index.ts`.

**F2 Implementation:**
Using Next.js 14+ `revalidateTag()`:
```typescript
import { revalidateTag } from 'next/cache';

export function invalidatePricingCache() {
  revalidateTag('pricing:v1:all');
  revalidateTag('pricing:v1:rules');
  revalidateTag('pricing:v1:tax');
  revalidateTag('pricing:v1:shipping');
}
```

**Tagged Functions:**
- `loadRules()` → tag: `pricing:v1:rules`
- `loadTaxConfig()` → tag: `pricing:v1:tax`
- `loadShippingZone()` → tag: `pricing:v1:shipping`
- `loadCatalogData()` → tag: `pricing:v1:all`

## Dependencies
- F2 Gate 2: Admin CRUD routes + RBAC middleware
- F2 Gate 3: Quote persistence (Quote model already in schema)
- Next.js cache: Requires `fetch()` with `next: { tags: [...] }` or `unstable_cache()` wrapper

## Testing Strategy
1. **Unit Test (stub above):** Test invalidation logic in isolation
2. **Integration Test:** Admin route → mutation → cache clear → new quote
3. **E2E Test (manual/Playwright):** Admin UI → change price → FE quote shows new price

## Status
- ✅ `invalidatePricingCache()` function exists (placeholder)
- ✅ Pricing module design supports cache invalidation
- ⏳ Admin CRUD routes pending (F2 Gate 2)
- ⏳ Cache tag integration pending (F2 Gate 2)
- ⏳ Quote persistence pending (F2 Gate 3)
