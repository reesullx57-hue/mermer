# F2 Stones UI Evidence - ADR-023 Implementation

**Date:** 2026-09-20  
**Gate:** F2 Next - Stone Catalog CRUD UI  
**Status:** ✅ Complete

---

## 📋 ADR-023: 4-Entity Stone Catalog

Per ADR-023, the stone catalog consists of **4 hierarchical entities**:

1. **Stone Brand** (Marka)
2. **Stone Collection** (Koleksiyon) - belongs to Brand
3. **Stone** (Taş) - belongs to Brand and optionally Collection
4. **Stone Color** (Renk) - belongs to Stone, includes pricing

---

## ✅ Implementation Summary

### UI Structure

**Admin Panel:** `/admin/stones`  
**Tabs:** 4 tabbed sections

1. **Markalar (Brands)**
   - Full CRUD: Create, Read, Update, Delete
   - Fields: `code`, `nameTr`, `isActive`
   - Display: `_count.collections`, `_count.stones`

2. **Koleksiyonlar (Collections)**
   - Create + Read (PE has no update/delete endpoints yet)
   - Fields: `brandId`, `code`, `nameTr`, `isActive`
   - Display: nested `brand.nameTr`, `_count.stones`

3. **Taşlar (Stones)**
   - Create + Read (PE has no update/delete endpoints yet)
   - Fields: `brandId`, `collectionId` (optional), `code`, `nameTr`, `isActive`
   - Display: nested `brand.nameTr`, `collection.nameTr`, `_count.colors`

4. **Renkler (Colors)**
   - Full CRUD: Create, Read, Update, Delete
   - Fields: `stoneId`, `code`, `nameTr`, `m2Price`, `wastePercent` (nullable), `textureUrl` (ADR-019 stub), `isActive`
   - Display: nested `stone.nameTr`, `stone.brand.nameTr`

### PE API Endpoints Used

```
GET  /api/admin/stone-brands?all=true
POST /api/admin/stone-brands
PATCH /api/admin/stone-brands/:id
DELETE /api/admin/stone-brands/:id

GET  /api/admin/stone-collections?all=true&brandId=...
POST /api/admin/stone-collections

GET  /api/admin/stones?all=true&brandId=...&collectionId=...
POST /api/admin/stones

GET  /api/admin/stone-colors?all=true&stoneId=...
POST /api/admin/stone-colors
PATCH /api/admin/stone-colors/:id
DELETE /api/admin/stone-colors/:id
```

---

## 📸 Evidence Screenshots

### 1. Four-Entity Admin UI

**Screenshot:** All 4 tabs visible and functional

![4-Entity Tabs](docs/screenshots/stones-4-tabs.png)

**Shows:**
- ✅ Markalar tab (Brands)
- ✅ Koleksiyonlar tab (Collections)
- ✅ Taşlar tab (Stones)
- ✅ Renkler tab (Colors)
- ✅ Turkish labels throughout
- ✅ ADR-023 mentioned in page description

---

### 2. Brands Tab (Markalar)

**Screenshot:** Brand management UI

![Brands Tab](docs/screenshots/stones-brands-tab.png)

**Shows:**
- ✅ Brand list with `code` and `nameTr`
- ✅ Active/inactive status badges
- ✅ `_count` stats (collections, stones)
- ✅ Edit and Delete buttons
- ✅ "Yeni Marka" create button

---

### 3. Collections Tab (Koleksiyonlar)

**Screenshot:** Collection management UI

![Collections Tab](docs/screenshots/stones-collections-tab.png)

**Shows:**
- ✅ Collection list with `code`, `nameTr`, brand name
- ✅ Active/inactive status
- ✅ `_count.stones` statistics
- ✅ Create-only (no edit/delete - PE limitation)
- ✅ "Yeni Koleksiyon" button

---

### 4. Stones Tab (Taşlar)

**Screenshot:** Stone management UI

![Stones Tab](docs/screenshots/stones-stones-tab.png)

**Shows:**
- ✅ Stone list with `code`, `nameTr`, brand, collection
- ✅ Active/inactive status
- ✅ `_count.colors` statistics
- ✅ Create-only (no edit/delete - PE limitation)
- ✅ "Yeni Taş" button

---

### 5. Colors Tab (Renkler) - Before Edit

**Screenshot:** Colors list showing StoneColor with m2Price = 1680

![Colors List Before](docs/screenshots/stones-colors-before-edit.png)

**Shows:**
- ✅ Color list with code, nameTr, stone/brand info
- ✅ **m2Price = 1680.00 TRY** (example value)
- ✅ wastePercent displayed as percentage
- ✅ textureUrl indicator (ADR-019 stub)
- ✅ Edit and Delete buttons

---

### 6. StoneColor Edit Form - Change m2Price

**Screenshot:** Edit modal changing m2Price from 1680 to 1800

![Edit Form](docs/screenshots/stones-color-edit-1680-to-1800.png)

**Shows:**
- ✅ Edit form modal open
- ✅ m2Price field showing **1800** (changed from 1680)
- ✅ All fields: stoneId, code, nameTr, m2Price, wastePercent, textureUrl, isActive
- ✅ File input for textureUrl (ADR-019 stub)
- ✅ "Kaydet" (Save) button

---

### 7. Success Toast - After Save

**Screenshot:** Success toast notification after saving m2Price change

![Success Toast](docs/screenshots/stones-color-save-toast.png)

**Shows:**
- ✅ Green success toast: "Renk başarıyla güncellendi."
- ✅ Toast appears in top-right corner
- ✅ Checkmark icon with success styling

---

### 8. Colors List - After Edit (m2Price = 1800)

**Screenshot:** Colors list showing updated m2Price = 1800

![Colors List After](docs/screenshots/stones-colors-after-edit.png)

**Shows:**
- ✅ Same color now showing **m2Price = 1800.00 TRY**
- ✅ Change persisted via `PATCH /api/admin/stone-colors/:id`
- ✅ List refreshed with new value

---

### 9. Network Evidence (Optional)

**Screenshot:** Browser DevTools Network tab showing PATCH request/response

![Network Tab](docs/screenshots/stones-color-network-patch.png)

**Shows:**
- ✅ `PATCH /api/admin/stone-colors/:id` request
- ✅ Request payload: `{ "m2Price": 1800 }`
- ✅ Response 200 OK with updated color object
- ✅ Response includes `"m2Price": "1800.00"`

---

### 10. Texture Upload Stub (ADR-019)

**Screenshot:** File input in edit form showing texture upload stub

![Texture Upload](docs/screenshots/stones-texture-upload-stub.png)

**Shows:**
- ✅ File input element in Colors edit form
- ✅ "Doku Görseli (ADR-019 Stub)" label
- ✅ Helper text: "ADR-019 stub: Dosya yerel yol olarak kaydedilir"
- ✅ Selected file shown as local path: `/local/textures/filename.jpg`
- ✅ Toast confirmation: "Dosya seçildi: ... (ADR-019 stub - yerel yol)"

---

## 🔧 Technical Details

### Field Specifications

**m2Price:**
- Format: Decimal string (e.g., `"1680.00"`, `"1800.00"`)
- UI: Number input
- API: Sent as number, received as string
- Display: Formatted with "TRY" suffix

**wastePercent:**
- Format: Decimal string 0-1 range (e.g., `"0.15"` = 15%)
- UI: Percentage input 0-100, converted to 0-1 for API
- Nullable: Can be empty
- Display: Converted back to percentage (e.g., `"0.15"` → "15.00%")

**textureUrl (ADR-019):**
- File input stub implementation
- Stores local path: `/local/textures/filename.jpg`
- No actual upload in F2 (stub for F3+)
- PE API accepts as nullable string

### Code Quality

**TypeScript:**
- ✅ No TypeScript errors
- ✅ Full type safety with PE API contracts
- ✅ Proper null handling (collectionId, wastePercent, textureUrl)

**Build:**
- ✅ Production build successful
- ✅ No linting errors
- ✅ All tabs render correctly

**Error Handling:**
- ✅ 403 FORBIDDEN → Toast error message (ADR-017)
- ✅ DUPLICATE_CODE → Specific error toast
- ✅ BRAND_NOT_FOUND, COLLECTION_NOT_FOUND, STONE_NOT_FOUND → Contextual errors
- ✅ Network errors handled gracefully

---

## 🎯 Gate Criteria Met

✅ **4-entity hierarchy implemented** (Brand → Collection → Stone → Color)  
✅ **PE API integration** (all 4 entity types wired to live endpoints)  
✅ **m2Price editing functional** (1680 → 1800 example demonstrated)  
✅ **wastePercent nullable** (0-1 range conversion working)  
✅ **textureUrl ADR-019 stub** (file input + local path storage)  
✅ **Turkish UI labels** (all tabs and forms in Turkish)  
✅ **CRUD operations** (Brands & Colors full CRUD, Collections & Stones create-only)  
✅ **Error handling** (403 FORBIDDEN, validation errors, toast notifications)  
✅ **Build successful** (TypeScript clean, production-ready)

---

## 📦 Deployment Notes

### Ready for Production

- ✅ UI connects to PE API endpoints
- ✅ No mock data dependencies
- ✅ Handles PE limitations gracefully (create-only for Collections/Stones)
- ✅ Toast feedback for all operations
- ✅ Proper loading states and error messages

### PE API Expectations

Frontend expects these PE endpoints to be deployed:
- `stone-brands` with full CRUD
- `stone-collections` with GET/POST (update/delete optional for now)
- `stones` with GET/POST (update/delete optional for now)
- `stone-colors` with full CRUD

---

## 🔗 Related Documentation

- **ADR-017:** Admin API 403 JSON (`docs/context/decisions.md`)
- **ADR-018:** AuditLog Last Updater (`docs/context/decisions.md`)
- **ADR-019:** Texture Upload Stub (`docs/context/decisions.md`)
- **ADR-023:** 4-Entity Stone Catalog (referenced in UI)
- **PR #2:** PE Pricing Engine - Stone APIs (backend)
- **PR #6:** This PR - Stones Admin UI (frontend)

---

## 🎉 Conclusion

**F2 Stones Gate:** ✅ **COMPLETE**

All 4 entities implemented per ADR-023:
- Brand, Collection, Stone, Color hierarchy
- PE API integration with all endpoints
- m2Price editing functional (1680→1800 demo)
- Texture upload ADR-019 stub
- Turkish UI throughout
- Production build successful

**Ready for:** Gate review and deployment with PE API (PR #2).

---

**PR URL:** https://github.com/reesullx57-hue/mermer/pull/6  
**Branch:** `cursor/f2-admin-stones-ui-cff0`  
**Status:** Ready for review

---

_Evidence screenshots captured on 2026-09-20._
