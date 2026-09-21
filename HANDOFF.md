# HANDOFF — Mutfak Tezgahı Konfigüratörü / Fiyatlandırma

> Tek başına yeni oturuma yapıştırılabilir. Kaynak repo: **https://github.com/reesullx57-hue/mermer**  
> Son güncelleme: 2026-09-21 · CoS kapanış özeti (F2 durduruldu — kredi)

---

## 1) Proje durumu

| Faz | Durum |
|-----|--------|
| **F0** Context lock (spec, contract, decisions, task-graph) | ✅ Tamam |
| **F1** Quote path (geometry, pricing, POST /api/pricing/quote, FE canlı) | ✅ Tamam |
| **F2** Admin panel | ⚠️ **9/10 modül** — FE catalog entegrasyon + Golden A/B regression **açık** |
| **F3** 3D konfigüratör | ❌ Başlamadı — **kapalı** |
| **F4+** | Kapalı |

**Şu an:** Yeni modül açılmayacak. Kredi gelince: *"FE catalog entegrasyondan devam edelim."*

---

## 2) Tamamlanan F2 modülleri

1. **RBAC** — Sayfa: yetkisiz → **307** `/403` · API: yetkisiz → **literal 403** JSON `{error:{code:"FORBIDDEN",...}}` (ADR-017)
2. **Catalog GET** — `/api/thicknesses`, `/api/form-types`, `/api/edge-types` · coef string `"1.10"` (ADR-014)
3. **`/admin/pricerules`** — CRUD · AuditLog · `invalidatePricingCache` · SINK_HOLE 300→400 → yeni quote **9929.98**, eski snapshot donuk
4. **`/admin/stones`** — 4 entity: Brand / Collection / Stone / Color · texture stub · `stones:*` gerçek invalidate · m2Price 1680→1800
5. **`/admin/catalog`** — Thickness / FormType / EdgeType · coef 1.10→1.20 → unitPrice 2231.46→2434.32
6. **`/admin/shipping`** — ShippingZone · district `""` = il geneli · fee invalidate
7. **`/admin/tax`** — TaxConfig VAT · vatRate invalidate
8. **`/admin/import`** — CSV atomik · dry-run · ImportJob · ADR-016/027/028
9. **`/admin/audit`** — filtre · pagination · before/after diff · ImportJob rozetleri · ADR-029

**Açık (F2 son %10):**
- FE quote formu: hardcoded thickness/form/edge id → catalog GET
- Golden A regression **9809.98**
- Golden B regression **8909.98** (address/dealer omit)

---

## 3) Açık işler (kredi sonrası sıra)

1. FE catalog entegrasyon (hardcoded id kaldır)
2. Golden A `9809.98` + B `8909.98` regression
3. F2 resmi kapanış onayı
4. **F3** 3D konfigüratör (henüz açılmadı)

---

## 4) ADR özeti (kısa)

| ADR | Özet |
|-----|------|
| 001–012 | F0/F1: fiyat UI'dan ayrı, Decimal string, snapshot, cache tags, seed temsili, F0 lock, sahiplik, yuvarlama, quantity string, snapshot alanları, alan geometrisi, waste |
| 013 | Quote request **DB id** (`stoneColorId`, `thicknessId`, `formTypeId`, `edgeTypeId`) — enum gövde yanıltıcı |
| 014 | Catalog GET endpoints |
| 015 | Admin-only RBAC |
| 016 | CSV import **atomik** (Accepted) |
| 017 | Sayfa **307→/403** · API **403 JSON** |
| 018 | "Son güncelleyen" = **AuditLog**, `updatedBy` kolonu yok |
| 019 | Texture: F2 local stub · F3+ R2/S3 |
| 020–022 | CSV lib/tx · Audit UI · stones:*/dealers:* (dealers F4) |
| 023 | Stones **4 ayrı entity** CRUD |
| 024–026 | Shipping/tax cache · CSV atomik detay |
| 027 | **ImportJob** modeli |
| 028 | CSV `row` = **dosya satırı** 1-based, header dahil |
| 029 | AuditLog UI filtre + diff |

---

## 5) Test durumu

- Son bilinen yeşil: **~134/134** (audit +10 dahil; import 124, stones 92, catalog 106, shipping+tax 118 — birikimli yükseliş)
- Tipik kırılım (yaklaşık): geometry ~20 · pricing ~20 · cache ~7+ · quote route ~4 · catalog ~9 · admin pricerules ~12–13 · stones ~18 · shipping/tax admin ~10 · import ~6 · audit ~10 · RBAC/integration diğerleri
- Golden A (canlı): L + sink/cooktop/install/shipping → **totalInclVat `9809.98`**
- Golden B: L + skirting+trim, **address omit** → **`8909.98`**

---

## 6) Bilinen tuzaklar

- Sayfa **307** / API **literal 403** — karıştırma (ADR-017)
- Cache: `pricing:v1:*` (all/rules/tax/shipping) · `stones:v1:all` · `dealers:*` F4
- `Quote.pricingSnapshot` **immutable** — fiyat değişse eski quote bozulmaz
- Fire **tek kez** (geometry → billableArea) · **4 çarpan**: m2Price × thickness × form × edge
- Money/oran string: `"1680.00"`, `"1.10"`, `"0.2000"`, alan 4 hane
- `district ""` = il geneli shipping
- CSV satır no = dosya satırı (header dahil) — ADR-028
- Nested payload: `sink`/`skirting`/`trim`/`sideBox`/`panelled` — flat yok
- `revalidateTag` üretimde next/cache'e bağlanmalı (stub log'du)

---

## 7) Repo / PR / komutlar

**Repo:** `https://github.com/reesullx57-hue/mermer` (tek kaynak)

**Önemli PR'lar (merge-ready bırakıldı):**
- PE: PR **#2** (schema, pricing, admin APIs, import, audit)
- FE: PR **#3** quote UI · **#4** RBAC · **#5** pricerules · **#6** stones · **#7** catalog · **#8** shipping/tax · **#9** import · **#10** audit

**Komutlar (tipik):**
```bash
npm install
cp .env.example .env   # DATABASE_URL, NEXTAUTH_*
npx prisma migrate dev
npx prisma db seed
npm test               # veya proje script'i
npm run dev
```

**Önemli path'ler:**
- `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/`
- `src/modules/geometry/`, `src/modules/pricing/`
- `src/app/api/pricing/quote/`, `src/app/api/admin/**`
- `docs/context/` veya `decisions.md` / `api-contract.json`
- FE: `app/` veya `src/app/` admin + `/teklif`

**Seed altın id'ler (F1 demo — catalog entegrasyon sonrası kalkacak):**
- stoneColor / thickness3 / L / radius — PE seed çıktısına bak; hardcoded FE'de kalmamalı

---

## Devam mesajı (kredi gelince)

> FE catalog entegrasyondan devam edelim: hardcoded thickness/formType/edgeType id → `/api/thicknesses`, `/api/form-types`, `/api/edge-types`; Golden A 9809.98 + B 8909.98 regression; sonra F2 kapanış onayı.
