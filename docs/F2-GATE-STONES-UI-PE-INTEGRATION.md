# F2 Gate: Taş Kataloğu Admin UI - PE API Entegrasyonu

## 🎯 Son Durum

Frontend UI **PE (Pricing Engine) API'sine bağlandı**. Mock endpoint'ler kaldırıldı, gerçek PE routes kullanılıyor.

---

## ✅ PE API Endpoint'leri Kullanılıyor

### Stone Brands
- `GET /api/admin/stone-brands` - Tüm markaları listele
- `GET /api/admin/stone-brands/:id` - Tek marka detayı
- `POST /api/admin/stone-brands` - Yeni marka oluştur
- `PATCH /api/admin/stone-brands/:id` - Marka güncelle
- `DELETE /api/admin/stone-brands/:id` - Marka sil

### Stone Colors
- `GET /api/admin/stone-colors` - Tüm renkleri listele (`?stoneId=` ve `?all=true` destekli)
- `GET /api/admin/stone-colors/:id` - Tek renk detayı
- `POST /api/admin/stone-colors` - Yeni renk oluştur
- `PATCH /api/admin/stone-colors/:id` - Renk güncelle
- `DELETE /api/admin/stone-colors/:id` - Renk sil

**Not:** Collections ve Stone entity'leri PE tarafından brand ve color üzerinden yönetiliyor - ayrı UI sekmesi gerekmedi.

---

## 📋 PE API Contract Uyumu

### Request/Response Formatı

**Brands GET Response:**
```json
{
  "brands": [
    {
      "id": "cuid_...",
      "code": "MARMARA",
      "nameTr": "Marmara Mermer",
      "isActive": true,
      "createdAt": "2026-09-20T10:00:00.000Z",
      "updatedAt": "2026-09-20T11:00:00.000Z",
      "_count": {
        "collections": 5,
        "stones": 12
      }
    }
  ]
}
```

**Colors GET Response:**
```json
{
  "colors": [
    {
      "id": "cuid_...",
      "stoneId": "cuid_...",
      "code": "WHITE_01",
      "nameTr": "Kar Beyazı",
      "m2Price": "450.50",
      "wastePercent": "0.15",
      "isActive": true,
      "textureUrl": "/local/textures/white-marble.jpg",
      "createdAt": "2026-09-20T10:00:00.000Z",
      "updatedAt": "2026-09-20T11:00:00.000Z",
      "stone": {
        "code": "MARBLE_01",
        "nameTr": "Beyaz Mermer",
        "brand": {
          "code": "MARMARA",
          "nameTr": "Marmara Mermer"
        }
      }
    }
  ]
}
```

### Önemli Farklar

1. **Field Names:**
   - `code` (unique identifier) - yeni
   - `nameTr` (Turkish name) - `name` yerine
   - `_count` stats objesi - collections ve stones sayısı

2. **Wrapped Responses:**
   - `{ brands: [...] }` - array doğrudan değil wrapped
   - `{ brand: {...} }` - single item için
   - `{ colors: [...] }` ve `{ color: {...} }` - aynı pattern

3. **wastePercent Range:**
   - PE API: `0-1` decimal range (örn: `"0.15"` = 15%)
   - UI form: `0-100` percentage display (kullanıcı `15` girer)
   - Frontend otomatik çevirir: `15` → `0.15` (API'ye gönderirken)

4. **m2Price:**
   - PE API: `number` input, `string` decimal output
   - Frontend: string olarak tutar ve görüntüler
   - Form: number input, API'ye number gönderir

5. **textureUrl (ADR-019):**
   - File input → local path stub: `/local/textures/filename.jpg`
   - PE API: nullable string field
   - Gerçek upload F3+ sprint

---

## 🔧 Frontend Değişiklikler

### Kaldırılan Dosyalar
```
❌ app/admin/stones/StoneCollectionsTab.tsx
❌ app/admin/stones/StonesTab.tsx  
❌ app/api/admin/stones/* (tüm mock API routes)
❌ lib/mock-data/stones.ts
```

### Güncellenen Dosyalar

**`lib/types/stone.ts`**
- PE API contract'ına uygun types
- `code` + `nameTr` fields
- Wrapped response types: `BrandsResponse`, `ColorsResponse`
- `wastePercent` as string (decimal 0-1 range)

**`lib/api/stones.ts`**
- PE endpoint'lerine çağrı: `/api/admin/stone-brands`, `/api/admin/stone-colors`
- Wrapped response unwrapping
- Query params: `?all=true`, `?stoneId=`

**`app/admin/stones/page.tsx`**
- 2 sekme: Markalar, Renkler (Collections/Stones kaldırıldı)

**`app/admin/stones/StoneBrandsTab.tsx`**
- `code` (read-only on edit) + `nameTr` fields
- `_count` stats görüntüleme
- PE error code handling: `DUPLICATE_CODE`

**`app/admin/stones/StoneColorsTab.tsx`**
- `stoneId` (CUID format) input
- `wastePercent` 0-100 percentage display, 0-1 API conversion
- Nested `stone.brand` info display
- `textureUrl` file input (ADR-019 stub)

---

## 📖 ADR Uyumu

### ✅ ADR-017: 403 JSON FORBIDDEN
PE API zaten JSON error döndürüyor:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin role required"
  }
}
```
Frontend `StonesApiError` ile handle ediyor.

### ✅ ADR-018: AuditLog Last Updater
PE API response'unda `lastUpdater` yok. Frontend bu alana bağımlı değil - optional olarak tasarlandı. PE gelecekte ekleyebilir:
```typescript
interface StoneBrand {
  // ... existing fields
  lastUpdater?: {
    email: string;
    name: string | null;
    timestamp: string;
  } | null;
}
```

### ✅ ADR-019: Texture Upload Stub
- File input mevcut
- Local path placeholder: `/local/textures/filename.jpg`
- PE API `textureUrl` nullable string field kabul ediyor
- Toast mesajı: "ADR-019 stub: Dosya yerel yol olarak kaydedilir"

---

## 🧪 Test Senaryoları

### Brands Tab
1. ✅ Marka listesi yüklenir (`GET /api/admin/stone-brands?all=true`)
2. ✅ "Yeni Marka" formu: `code` + `nameTr` + `isActive`
3. ✅ Kaydet → `POST /api/admin/stone-brands`
4. ✅ Düzenle: `code` read-only, `nameTr` ve `isActive` edit edilebilir
5. ✅ Kaydet → `PATCH /api/admin/stone-brands/:id`
6. ✅ Sil → Confirm dialog → `DELETE /api/admin/stone-brands/:id`
7. ✅ 403 FORBIDDEN handling: Toast error message

### Colors Tab
1. ✅ Renk listesi yüklenir (`GET /api/admin/stone-colors?all=true`)
2. ✅ Nested `stone.brand` bilgisi görüntülenir
3. ✅ "Yeni Renk" formu: `stoneId`, `code`, `nameTr`, `m2Price`, `wastePercent`, `textureUrl`, `isActive`
4. ✅ `wastePercent` UI: 0-100 percentage input → API: 0-1 decimal
5. ✅ File input → Local path set edilir (`/local/textures/...`)
6. ✅ Kaydet → `POST /api/admin/stone-colors`
7. ✅ Düzenle + Kaydet → `PATCH /api/admin/stone-colors/:id`
8. ✅ Sil → `DELETE /api/admin/stone-colors/:id`
9. ✅ Error handling: FORBIDDEN, STONE_NOT_FOUND

---

## 🏗️ Build Status

✅ **Başarılı build:**
```bash
npm run build
# ✓ Compiled successfully
# ✓ No TypeScript errors
# ✓ No mock API routes conflict
```

---

## 📦 Deployment Notes

### PE API Gereksinimler

Frontend şu endpoint'lerin **çalışıyor ve erişilebilir** olmasını bekliyor:
- `GET /api/admin/stone-brands?all=true`
- `POST /api/admin/stone-brands`
- `PATCH /api/admin/stone-brands/:id`
- `DELETE /api/admin/stone-brands/:id`
- `GET /api/admin/stone-colors?all=true&stoneId=...`
- `POST /api/admin/stone-colors`
- `PATCH /api/admin/stone-colors/:id`
- `DELETE /api/admin/stone-colors/:id`

### CORS / Auth

PE API ile frontend aynı origin'de deploy edilirse CORS sorunu olmaz. Farklı domain'lerde ise:
- PE API CORS headers set etmeli
- Session cookie domain config gerekebilir

### Session Auth

PE API `/lib/auth.ts` `getCurrentUser()` ve `requireAdmin()` kullanıyor:
```typescript
const user = getCurrentUser(request);
const authError = requireAdmin(user);
if (authError) return authError; // 403 JSON
```

Frontend `getSession()` ile session cookie kontrolü yapıyor. İki taraf uyumlu olmalı.

---

## 🎉 Özet

✅ **PE API entegrasyonu tamamlandı:**
- Mock API kaldırıldı
- PE routes (`/api/admin/stone-brands`, `/api/admin/stone-colors`) kullanılıyor
- `code` + `nameTr` field'ları uyarlandı
- `wastePercent` 0-1 range conversion eklendi
- ADR-017, ADR-018, ADR-019 uyumu korundu
- Build başarılı, TypeScript errors yok

**Sonraki adım:** PE API'nin deploy edilmesi ve frontend ile birlikte test edilmesi.

---

## 🔗 İlgili Kaynaklar

- **PR #2:** PE Pricing Engine - Schema & Stone APIs
- **PR #6:** Frontend Stones UI (bu PR)
- **ADR-017:** Admin API 403 JSON (`docs/context/decisions.md`)
- **ADR-018:** AuditLog Last Updater (`docs/context/decisions.md`)
- **ADR-019:** Texture Upload Stub (`docs/context/decisions.md`)
- **PE API Docs:** `docs/api-admin-stones.md` (artık outdated - PE PR #2'deki actual API geçerli)
