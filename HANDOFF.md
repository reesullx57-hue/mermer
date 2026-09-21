# 🔄 Handoff Dokümanı: Mermer Pricing Engine

## 1️⃣ Proje Durumu

### Tamamlanan Fazlar
- ✅ **F0**: Repo setup, temel yapı (Prisma, TypeScript, Next.js, Jest)
- ✅ **F1**: Schema + migration + seed + geometry + pricing modules + Golden A/B unit tests

### Devam Eden Faz
- ⏸️ **F2**: Admin APIs (9/10 tamamlandı)
  - ✅ Gate 1: Catalog GET endpoints (thicknesses, form-types, edge-types)
  - ✅ Gate 2: PriceRules CRUD + cache invalidation + RBAC
  - ✅ Gate 3: Stones admin CRUD (4-entity: Brand/Collection/Stone/Color)
  - ✅ Gate 4: Catalog admin CRUD (Thickness/FormType/EdgeType coefficients)
  - ✅ Gate 5: Shipping + Tax admin CRUD with cache invalidation
  - ✅ Gate 6: CSV Import (atomic, validation errors, dryRun)
  - ✅ Gate 7: Audit Log API (filtering, pagination, ImportJob metadata)
  - ⏸️ **Gate 8 (AÇIK)**: FE catalog entegrasyon + Golden A/B regression (DURAKLADI)

### Başlanmamış Fazlar
- ❌ **F3**: 3D viewer entegrasyonu + Quote persistence + R2/S3 texture upload

---

## 2️⃣ Tamamlanan F2 Modülleri

| Modül | Durum | Açıklama |
|-------|-------|----------|
| **Catalog Public GET** | ✅ | `/api/thicknesses`, `/api/form-types`, `/api/edge-types` — FE için catalog data |
| **PriceRules CRUD** | ✅ | `/api/admin/pricerules` — ADMIN only, AuditLog, cache invalidation |
| **Stones CRUD** | ✅ | 4-entity (Brand/Collection/Stone/Color), texture stub, m2Price/wastePercent |
| **Catalog CRUD** | ✅ | Thickness/FormType/EdgeType admin endpoints, coefficient updates |
| **Shipping CRUD** | ✅ | `/api/admin/shipping-zones` — city/district/fee, cache tags |
| **Tax CRUD** | ✅ | `/api/admin/tax-configs` — VAT_TR rate, cache tags |
| **CSV Import** | ✅ | `/api/admin/import/stones` — atomic, two-pass validation, dryRun |
| **Audit Log API** | ✅ | `/api/admin/audit` — filter by entity/user/action/date, pagination, ImportJob metadata |
| **RBAC + Auth Helpers** | ✅ | `requireAdmin()`, 403 JSON responses, stub session via headers |
| **Cache Invalidation** | ✅ | `pricing:v1:*`, `stones:v1:all` tags; tested for PriceRule/StoneColor/Thickness/Shipping/Tax |

---

## 3️⃣ Açık İşler (F2 Gate 8 + F3)

### ⚠️ F2 Gate 8: FE Catalog Entegrasyon (DURAKLADI — Credits Bekleniyor)
- **Problem**: FE demo/hardcoded seed IDs kullanıyor → `/api/thicknesses`, `/api/form-types`, `/api/edge-types` entegrasyonu eksik
- **Gerekli**: FE ConfigForm component'ini catalog GET'lere bağla, dropdown options'ları dynamic populate et
- **Test**: Golden A (9809.98) + Golden B (8909.98) regression — FE integration test suite

### ❌ F3: 3D Viewer + Quote Persistence
- **3D**: Stone texture preview, countertop 3D render (Three.js/Babylon.js?)
- **Persistence**: Quote model CRUD, pricingSnapshot save/retrieve, version history
- **Texture Upload**: R2/S3 adapter for `public/uploads/textures/` → cloud storage
- **Auth**: Real session/JWT (şu an header-based stub)

---

## 4️⃣ Architecture Decision Records (ADR-001…029)

Tüm ADR'ler `docs/context/decisions.md` dosyasında detaylı açıklanmıştır. Özet:

1. **ADR-001**: Contract v1.0.0 snapshot format — money 2 decimals, coefficients 2, VAT 4, areas 4
2. **ADR-002**: VAT centralization — TaxConfig.vatRate, not PriceRule
3. **ADR-003**: Waste source tracking — stone-specific vs global
4. **ADR-004**: Geometry module separation — reusable area/waste logic
5. **ADR-005**: Decimal.js for money operations — no JS float for finance
6. **ADR-006**: Skirting/trim quantity calculation — leg1/100 for L forms
7. **ADR-007**: Flat contract response — no `{success, data}` wrapper
8. **ADR-008**: Always-present fields — currency, warnings[], appliedDiscounts[], computedAt
9. **ADR-009**: Error response format — `{error: {code, message, details?}}`
10. **ADR-010**: Quote persistence deferred — F3+
11. **ADR-011**: Line item sorting — sortOrder field for display consistency
12. **ADR-012**: Zod schema validation — runtime + TypeScript type inference
13. **ADR-013**: Quote request uses DB IDs — stoneColorId/thicknessId/formTypeId/edgeTypeId (not enums)
14. **ADR-014**: Catalog list endpoints — GET /api/thicknesses etc. for FE dynamic options
15. **ADR-015**: Admin RBAC — Role.ADMIN required for /admin/* routes
16. **ADR-016**: CSV import atomic — two-pass validation, Prisma transaction, zero partial writes
17. **ADR-017**: Admin auth response patterns — pages redirect to /403, APIs return 403 JSON
18. **ADR-018**: Last updater from AuditLog — no updatedBy column migration
19. **ADR-019**: Texture upload strategy — F2 local filesystem stub, F3 R2/S3 adapter
20. **ADR-020**: CSV import library — csv-parse, streaming, atomic transaction (planned detail)
21. **ADR-021**: AuditLog UI filtering — entityType/userId/date range, pagination (planned)
22. **ADR-022**: Cache tag strategy — PriceRule → pricing:v1:*, StoneColor → stones:v1:all + pricing:v1:all
23. **ADR-023**: Stones admin entity model — 4-entity CRUD (Brand/Collection/Stone/Color)
24. **ADR-024**: Shipping cache tags — pricing:v1:shipping + pricing:v1:all (planned)
25. **ADR-025**: Tax cache tags — pricing:v1:tax + pricing:v1:all (planned)
26. **ADR-026**: CSV atomic transaction details — parser, validation pass, Prisma transaction (planned)
27. **ADR-027**: ImportJob model vs AuditLog-only — lightweight ImportJob + one AuditLog summary per import
28. **ADR-028**: CSV row numbering UX — 1-based file line numbers (Excel-aligned)
29. **ADR-029**: AuditLog UI filtering and display — pagination 50/page, ImportJob metadata, before/after JSON

---

## 5️⃣ Test Durumu: 134/134 ✅

Tüm testler geçiyor. Kategori bazında dökümü:

```
TOPLAM: 134 test, tümü PASS

Kategori Detayı:
├── Geometry (4 tests)
│   └── src/modules/geometry/index.test.ts — computeArea, applyWaste, STRAIGHT/L/U/ISLAND goldens
│
├── Pricing Core (12 tests)
│   ├── src/modules/pricing/index.test.ts — unitPrice, computeQuote, line items, snapshot shape
│   └── src/modules/pricing/cache-invalidation-tags.test.ts — revalidateTag spy, pricing:v1:* tags
│
├── Pricing Integration (15 tests)
│   ├── src/modules/pricing/cache-invalidation.test.ts — PriceRule SINK_HOLE 300→400
│   ├── src/modules/pricing/full-integration.test.ts — Quote persistence, snapshot immutability
│   ├── src/modules/pricing/stones-cache-invalidation.test.ts — StoneColor m2Price 1680→1800
│   ├── src/modules/pricing/catalog-cache-invalidation.test.ts — Thickness coefficient 1.10→1.20
│   └── src/modules/pricing/shipping-tax-cache-invalidation.test.ts — Kadıköy fee 400→500, VAT 0.20→0.18
│
├── API Routes: Quote (6 tests)
│   └── src/app/api/pricing/quote/route.test.ts — Golden A/B, nested request schema, flat response
│
├── API Routes: Public Catalog (9 tests)
│   ├── src/app/api/thicknesses/route.test.ts — GET active thicknesses with code/cm
│   ├── src/app/api/form-types/route.test.ts — GET active form types
│   └── src/app/api/edge-types/route.test.ts — GET active edge types
│
├── API Routes: Admin PriceRules (10 tests)
│   ├── src/app/api/admin/pricerules/route.test.ts — GET list, POST create, RBAC 403
│   └── src/app/api/admin/pricerules/[id]/route.test.ts — GET by id, PATCH update, AuditLog
│
├── API Routes: Admin Stones (28 tests)
│   ├── src/app/api/admin/stone-brands/route.test.ts — Brand CRUD + RBAC
│   ├── src/app/api/admin/stone-collections/route.test.ts — Collection CRUD
│   ├── src/app/api/admin/stones/route.test.ts — Stone CRUD
│   └── src/app/api/admin/stone-colors/route.test.ts — Color CRUD, m2Price/wastePercent, textureUrl stub
│
├── API Routes: Admin Catalog (18 tests)
│   ├── src/app/api/admin/thicknesses/route.test.ts — Thickness CRUD, coefficient update
│   ├── src/app/api/admin/form-types/route.test.ts — FormType CRUD
│   └── src/app/api/admin/edge-types/route.test.ts — EdgeType CRUD
│
├── API Routes: Admin Shipping+Tax (12 tests)
│   ├── src/app/api/admin/shipping-zones/route.test.ts — ShippingZone CRUD, fee update, city/district
│   └── src/app/api/admin/tax-configs/route.test.ts — TaxConfig GET/PATCH, vatRate update
│
├── API Routes: Admin Import (6 tests)
│   └── src/app/api/admin/import/stones/route.test.ts — CSV atomic rollback, 10/10 success, dryRun, errors
│
└── API Routes: Admin Audit (10 tests)
    └── src/app/api/admin/audit/route.test.ts — Filter by entity/user/action, pagination, ImportJob metadata

Test Komutları:
  npm test                      # Tüm testler
  npm test -- --watch           # Watch mode
  npm test -- --coverage        # Coverage report
  npm test -- path/to/file.test.ts  # Tek dosya
```

**Testler hakkında notlar:**
- Tüm test isolation sağlanmış (beforeAll/afterAll hooks ile data setup/cleanup)
- Golden A (9809.98) + Golden B (8909.98) unit testlerde geçiyor
- Cache invalidation integration testleri REAL Prisma queries ile çalışıyor
- AuditLog/ImportJob testleri VALIDATION_ERROR + SUCCESS senaryolarını kapsıyor

---

## 6️⃣ Bilinen Tuzaklar

### ⚠️ Test Pollution: PriceRule Değişiklikleri
- **Problem**: `SINK_HOLE` PriceRule değişikliği bir testte yapılır ama restore edilmezse, diğer testler fail eder.
- **Çözüm**: Her integration test dosyasında `afterAll` hook ile seed değerlere geri dön (örn: SINK_HOLE → 300.00).
- **Örnek**: `src/modules/pricing/full-integration.test.ts` → `afterAll` ile SINK_HOLE restore.

### ⚠️ Decimal String Formatting
- **Problem**: `Decimal.toString()` trailing zeros'u kaldırır → `"1.1"` yerine `"1.10"` bekleniyor.
- **Çözüm**: DAIMA `Decimal.toFixed(2)` (money/coefficients) veya `toFixed(4)` (rates/areas) kullan.
- **Örnek**: `unitPrice.toFixed(2)`, `coefficient.toFixed(2)`, `vatRate.toFixed(4)`.

### ⚠️ ts-node Alias Resolution
- **Problem**: `ts-node` ile `@/` import alias çalışmıyor (route handler import'larında).
- **Çözüm**: Evidence script'lerinde DOĞRUDAN Prisma query yaz, route handler import etme.
- **Örnek**: `scripts/audit-evidence-simple.ts` → direkt Prisma kullanıyor.

### ⚠️ CSV Row Numbering
- **Problem**: CSV error row numaraları Excel ile uyuşmazsa user confused olur.
- **Çözüm**: ADR-028 → DAIMA 1-based FILE line number report et (header dahil).
- **Örnek**: Header + 10 data row → row numbers 2-11.

### ⚠️ ImportJob AuditLog entityType
- **Problem**: Import işlemleri `entityType='Stone'` olarak yazılıyordu, filter `?entityType=ImportJob` çalışmıyordu.
- **Çözüm (FIX UYGULANMIŞ)**: Import route artık `entityType='ImportJob'` kullanıyor.
- **Örnek**: `src/app/api/admin/import/stones/route.ts` → `entityType: 'ImportJob'`.

### ⚠️ Nested Request Schema
- **Problem**: Flat `skirtingEnabled`, `trimEnabled` yerine nested `{enabled, ...}` kullanılması gerekiyor.
- **Çözüm**: Zod schema nested objeler kabul ediyor: `sink: {type, holes?}`, `skirting: {enabled, heightCm?}`.
- **Örnek**: `src/modules/pricing/schemas.ts` → `ConfigurationInputSchema`.

### ⚠️ Prisma JSON Fields: null vs Prisma.JsonNull
- **Problem**: `before: null` → TypeScript error `Type 'null' is not assignable to...`.
- **Çözüm**: `Prisma.JsonNull` kullan veya `as any` cast.
- **Örnek**: `before: Prisma.JsonNull` → ImportJob errorReport.

---

## 7️⃣ Dosya Yapısı + Komutlar

### 📁 Önemli Dosya Yolları

```
mermer/
├── prisma/
│   ├── schema.prisma          # Veritabanı modelleri (User, PriceRule, Stone*, Thickness, etc.)
│   ├── migrations/            # Migration SQL files (init + updates)
│   └── seed.ts                # Seed data (admin user, dealer, stones, rules, tax, shipping)
│
├── src/
│   ├── lib/
│   │   └── auth.ts            # getCurrentUser(), requireAdmin() — stub session via headers
│   │
│   ├── modules/
│   │   ├── geometry/
│   │   │   ├── index.ts       # computeArea, applyWaste
│   │   │   └── index.test.ts  # STRAIGHT/L/U/ISLAND goldens
│   │   │
│   │   └── pricing/
│   │       ├── index.ts       # computeQuote, loadRules, invalidatePricingCache, invalidateCatalogCache
│   │       ├── schemas.ts     # Zod schemas (ConfigurationInputSchema, nested objects)
│   │       ├── types.ts       # PricingRules, PricingSnapshot interfaces
│   │       ├── index.test.ts  # Unit tests (unitPrice, snapshot shape)
│   │       ├── cache-invalidation*.test.ts  # Integration tests (PriceRule/Stone/Catalog/Shipping/Tax)
│   │       └── full-integration.test.ts     # Quote persistence + snapshot immutability
│   │
│   └── app/api/
│       ├── pricing/quote/
│       │   ├── route.ts       # POST /api/pricing/quote — Golden A/B endpoint
│       │   └── route.test.ts  # Integration tests
│       │
│       ├── thicknesses/       # GET /api/thicknesses (public catalog)
│       ├── form-types/        # GET /api/form-types
│       ├── edge-types/        # GET /api/edge-types
│       │
│       └── admin/
│           ├── pricerules/    # CRUD + RBAC + AuditLog
│           ├── stone-brands/  # Stones 4-entity CRUD
│           ├── stone-collections/
│           ├── stones/
│           ├── stone-colors/  # m2Price, wastePercent, textureUrl
│           ├── thicknesses/   # Catalog coefficient CRUD
│           ├── form-types/
│           ├── edge-types/
│           ├── shipping-zones/  # City/district/fee CRUD
│           ├── tax-configs/     # VAT rate CRUD
│           ├── import/stones/   # CSV import (atomic, dryRun)
│           └── audit/           # GET audit logs (filter, pagination)
│
├── scripts/
│   ├── live-http-golden-a.ts     # Golden A real HTTP POST test
│   ├── import-gate-simple-evidence.ts  # Import evidence (atomic rollback, success)
│   ├── ic001-quote-proof.ts      # IC001 import → quote numerical proof
│   ├── audit-evidence-simple.ts  # Audit gate evidence (filters, pagination, ImportJob)
│   └── audit-final-evidence.ts   # Final 3 clarifications (negative filters, pageSize=3, ImportJob fix)
│
└── docs/context/
    ├── decisions.md           # ADR-001…029 (architecture decisions)
    ├── api-contract.json      # API contract v1.1.0 (request/response schemas)
    └── task-graph.md          # F0/F1/F2 task graph (F2 paused)
```

### 🔧 Komutlar

#### Prisma + DB
```bash
# Migration oluştur + uygula
npx prisma migrate dev --name <migration-name>

# Seed DB (test data)
npx prisma db seed
# veya direkt:
npx ts-node prisma/seed.ts

# Prisma Studio (DB GUI)
npx prisma studio

# DB reset (DROP + migrate + seed)
npx prisma migrate reset
```

#### Test
```bash
# Tüm testler (134/134)
npm test

# Watch mode
npm test -- --watch

# Tek dosya
npm test -- src/modules/pricing/index.test.ts

# Coverage
npm test -- --coverage

# Test listesi
npm test -- --listTests
```

#### Dev Server (Next.js)
```bash
npm run dev
# → http://localhost:3000

# Build + start (production)
npm run build
npm start
```

#### Evidence Scripts (PO gate reports)
```bash
# Golden A live HTTP call
npx ts-node scripts/live-http-golden-a.ts

# Import gate evidence
npx ts-node scripts/import-gate-simple-evidence.ts

# IC001 import → quote proof
npx ts-node scripts/ic001-quote-proof.ts

# Audit gate evidence (6 items)
npx ts-node scripts/audit-evidence-simple.ts

# Audit final clarifications (3 items)
npx ts-node scripts/audit-final-evidence.ts
```

### 🔗 PR ve Branch Bilgileri

- **Ana PR**: [PE #2](https://github.com/reesullx57-hue/mermer/pull/2) — F1 + F2 Gate 1-7
- **Branch**: `cursor/pricing-engine-f1-schema-migration-a29a`
- **Base branch**: `main`
- **PR Durumu**: ✅ Tüm testler geçiyor, merge-ready (Gate 8 bekleniyor)

**F2 Gate 8 Waiting:**
- FE Catalog Integration PR: #10 (audit UI) — separate branch
- Golden A/B regression tests FE integration'a bağlı

---

## 8️⃣ Next Session Quick Start

Yeni session başladığında şu adımları takip et:

1. **Bu HANDOFF.md'yi oku** — proje durumu, açık işler, tuzaklar
2. **Test suite'i çalıştır** — `npm test` → 134/134 PASS olmalı
3. **ADR-001…029'u oku** — `docs/context/decisions.md` → mimari kararlar
4. **API contract'ı incele** — `docs/context/api-contract.json` → v1.1.0 request/response schemas
5. **PR #2'yi gözden geçir** — mevcut diff, comments, CI status

### F2 Gate 8 Resume (Credits Geldiğinde)
- [ ] FE ConfigForm'u `/api/thicknesses`, `/api/form-types`, `/api/edge-types` ile entegre et
- [ ] Golden A (9809.98) regression test — FE integration test suite ekle
- [ ] Golden B (8909.98) regression test — skirting/trim enabled path
- [ ] PR #2'yi FE ile merge et, F2 close

### F3 Planning (Sonrası)
- [ ] Quote persistence API + model CRUD
- [ ] Real auth/session (şu an header-based stub)
- [ ] R2/S3 texture upload adapter
- [ ] 3D viewer entegrasyonu (Three.js/Babylon.js)
- [ ] AuditLog UI visual diff highlighting
- [ ] CSV import retry/resume mechanism

---

## 📝 Son Notlar

- **Krediler bittiği için F2 Gate 8 pause edildi** — FE catalog entegrasyon + Golden regression açık
- **F1 + F2 (Gate 1-7) tamamen tamamlandı** — tüm backend APIs ready, 134/134 test PASS
- **PR #2 merge-ready** — test suite yeşil, conflicts yok
- **ADR-029'a kadar tüm kararlar dokümante** — yeni session için context hazır
- **Evidence scripts mevcut** — PO gate reports için direkt çalıştırılabilir

---

**Handoff Date**: 2026-09-21  
**Last Agent**: Claude Sonnet 4.5 (Cloud Agent)  
**PR**: https://github.com/reesullx57-hue/mermer/pull/2  
**Branch**: `cursor/pricing-engine-f1-schema-migration-a29a`  
**Test Status**: 134/134 PASS ✅
