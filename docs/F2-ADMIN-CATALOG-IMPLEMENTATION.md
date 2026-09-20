# F2 Admin Katalog UI İmplementasyonu

**PR:** #7  
**Branch:** `cursor/f2-admin-catalog-ui-4f36`  
**Tarih:** 20 Eylül 2026

---

## 📋 Özet

Bu dokümantasyon, `/admin/catalog` sayfasında **Thickness (Kalınlık)**, **FormType (Form Tipi)** ve **EdgeType (Kenar Tipi)** varlıkları için admin CRUD UI implementasyonunu açıklar.

---

## 🎯 Hedefler

### Kullanıcı Hikayeleri
1. **Admin kullanıcı olarak**, kalınlık opsiyonlarını (2cm, 3cm, 4cm) ve katsayılarını yönetebilmeliyim
2. **Admin kullanıcı olarak**, form tiplerini (L, U, düz) ve katsayılarını yönetebilmeliyim
3. **Admin kullanıcı olarak**, kenar tiplerini (cilalı, mat) ve katsayılarını yönetebilmeliyim
4. **Admin kullanıcı olarak**, her varlık için son güncelleyeni görebilmeliyim
5. **Sistem olarak**, admin olmayan kullanıcılara 403 FORBIDDEN döndürmeliyim

---

## 🏗️ Mimari

### Komponent Hiyerarşisi

```
app/admin/catalog/page.tsx (Ana sayfa + tab yönetimi)
├── ThicknessesTab.tsx (Kalınlıklar sekmesi)
├── FormTypesTab.tsx (Form Tipleri sekmesi)
└── EdgeTypesTab.tsx (Kenar Tipleri sekmesi)
```

### API Katmanları

```
Frontend Components
    ↓
lib/api/catalog.ts (API client functions)
    ↓
app/api/admin/[entity]/route.ts (Admin API endpoints)
    ↓
Prisma ORM
    ↓
PostgreSQL Database
```

---

## 📊 Veri Modelleri

### Thickness (Kalınlık)

**Schema:**
```prisma
model Thickness {
  id          String   @id @default(cuid())
  cm          Int      @unique
  nameTr      String
  coefficient Decimal  @db.Decimal(12, 4)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**UI Görünümü:**
| Kalınlık (cm) | Türkçe Adı | Katsayı | Durum | Son Güncelleyen |
|---------------|------------|---------|-------|-----------------|
| 2             | 2 cm       | 1.00    | Aktif | admin@...       |
| 3             | 3 cm       | 1.10    | Aktif | admin@...       |
| 4             | 4 cm       | 1.20    | Aktif | -               |

### FormType (Form Tipi)

**Schema:**
```prisma
model FormType {
  id          String   @id @default(cuid())
  code        String   @unique
  nameTr      String
  coefficient Decimal  @db.Decimal(12, 4)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Örnek Değerler:**
| Kod      | Türkçe Adı | Katsayı |
|----------|------------|---------|
| STRAIGHT | Düz        | 1.00    |
| L_SHAPE  | L Form     | 1.15    |
| U_SHAPE  | U Form     | 1.30    |

### EdgeType (Kenar Tipi)

**Schema:**
```prisma
model EdgeType {
  id          String   @id @default(cuid())
  code        String   @unique
  nameTr      String
  coefficient Decimal  @db.Decimal(12, 4)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Örnek Değerler:**
| Kod      | Türkçe Adı | Katsayı |
|----------|------------|---------|
| POLISHED | Cilalı     | 1.00    |
| MATTE    | Mat        | 1.05    |
| BEVELED  | Pah Kırık  | 1.10    |

---

## 🔌 API Spesifikasyonları

### Thickness Endpoints

#### `GET /api/admin/thicknesses`
Tüm kalınlıkları döndürür (aktif + pasif).

**Request:**
```http
GET /api/admin/thicknesses
Authorization: Cookie (session)
```

**Response (200 OK):**
```json
[
  {
    "id": "cm123abc",
    "cm": 2,
    "nameTr": "2 cm",
    "coefficient": "1.00",
    "isActive": true,
    "createdAt": "2026-09-15T10:00:00.000Z",
    "updatedAt": "2026-09-20T14:30:00.000Z",
    "lastUpdater": {
      "email": "admin@mermer.com",
      "timestamp": "2026-09-20T14:30:00.000Z"
    }
  }
]
```

**Response (403 FORBIDDEN):**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required"
  }
}
```

#### `POST /api/admin/thicknesses`
Yeni kalınlık oluşturur.

**Request:**
```json
{
  "cm": 5,
  "nameTr": "5 cm",
  "coefficient": "1.25"
}
```

**Response (201 Created):**
```json
{
  "id": "cm456def",
  "cm": 5,
  "nameTr": "5 cm",
  "coefficient": "1.2500",
  "isActive": true,
  "createdAt": "2026-09-20T15:00:00.000Z",
  "updatedAt": "2026-09-20T15:00:00.000Z"
}
```

**Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Thickness with this cm value already exists"
  }
}
```

#### `PATCH /api/admin/thicknesses/[id]`
Kalınlığı günceller (nameTr ve/veya coefficient).

**Request:**
```json
{
  "nameTr": "2 santimetre",
  "coefficient": "1.05"
}
```

**Response (200 OK):**
```json
{
  "id": "cm123abc",
  "cm": 2,
  "nameTr": "2 santimetre",
  "coefficient": "1.0500",
  "isActive": true,
  "createdAt": "2026-09-15T10:00:00.000Z",
  "updatedAt": "2026-09-20T15:10:00.000Z"
}
```

#### `DELETE /api/admin/thicknesses/[id]`
Kalınlığı devre dışı bırakır (soft delete).

**Response (200 OK):**
```json
{
  "success": true
}
```

### FormType ve EdgeType
Aynı API pattern'ini kullanır, sadece field isimleri farklıdır:
- Thickness: `cm` (number)
- FormType/EdgeType: `code` (string)

---

## 🎨 UI Bileşenleri

### Ana Sayfa (CatalogPage)

**Özellikler:**
- 3 sekme navigasyonu
- Aktif sekme mavi vurgu
- Sekme arası geçiş state yönetimi

### Tab Bileşenleri (ThicknessesTab, FormTypesTab, EdgeTypesTab)

**Durum Yönetimi:**
```typescript
const [items, setItems] = useState<T[]>([]);           // Varlık listesi
const [loading, setLoading] = useState(true);          // Yükleme durumu
const [error, setError] = useState<string | null>();   // Hata mesajı
const [formMode, setFormMode] = useState<FormMode>();  // 'create' | 'edit' | null
const [selectedItem, setSelectedItem] = useState<T>(); // Düzenlenen varlık
const [submitting, setSubmitting] = useState(false);   // Form submit durumu
```

**UI Durumları:**
1. **Loading**: Spinner gösterilir
2. **Error**: Kırmızı hata kutusu
3. **Empty**: "Henüz varlık yok" mesajı + Oluştur butonu
4. **Data**: Tablo görünümü
5. **Form Modal**: Oluştur/Düzenle formu

### Form Modal

**Alanlar (Thickness örneği):**
```tsx
<input type="number" name="cm" disabled={mode === 'edit'} />
<input type="text" name="nameTr" required />
<input type="text" name="coefficient" required pattern="[0-9]+\.[0-9]{2}" />
```

**Validasyon:**
- `cm`: Pozitif tam sayı, edit modunda değiştirilemez
- `code`: Uppercase string, edit modunda değiştirilemez
- `nameTr`: Boş olamaz
- `coefficient`: Decimal format (örn: "1.00", "1.10")

---

## 🛡️ Güvenlik

### Authentication & Authorization

1. **Session Check**: `getSession()` ile kullanıcı oturumu kontrol edilir
2. **Role Check**: `session.role === 'ADMIN'` kontrolü
3. **403 Response**: Admin olmayan kullanıcılar reddedilir

```typescript
const session = await getSession();
if (!session || session.role !== 'ADMIN') {
  return NextResponse.json(
    { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
    { status: 403 }
  );
}
```

### Audit Logging (ADR-018)

Her CRUD işleminde AuditLog kaydı oluşturulur:

```typescript
await prisma.auditLog.create({
  data: {
    userId: session.userId,
    action: 'UPDATE',              // CREATE | UPDATE | DEACTIVATE
    entityType: 'Thickness',       // Thickness | FormType | EdgeType
    entityId: id,
    before: { /* eski değerler */ },
    after: { /* yeni değerler */ },
  },
});
```

---

## 🧪 Test Senaryoları

### 1. Thickness CRUD
- [ ] Yeni kalınlık oluştur (2cm, katsayı 1.00)
- [ ] Kalınlık listesinde göründüğünü kontrol et
- [ ] Kalınlığı düzenle (katsayıyı 1.05 yap)
- [ ] Kalınlığı devre dışı bırak
- [ ] Pasif kalınlık gri arka planla görünsün

### 2. FormType CRUD
- [ ] L_SHAPE form tipi oluştur
- [ ] Kod değiştirememeyi kontrol et (edit modunda disabled)
- [ ] Katsayı güncellemesini test et

### 3. EdgeType CRUD
- [ ] POLISHED kenar tipi oluştur
- [ ] Son Güncelleyen kolonunda email göründüğünü kontrol et

### 4. Hata Yönetimi
- [ ] 403 FORBIDDEN: Admin olmayan kullanıcıyla eriş
- [ ] 400 VALIDATION: Duplicate code ile oluşturmayı dene
- [ ] Toast bildirimleri gösteriliyor mu kontrol et

### 5. UX
- [ ] Loading spinner çalışıyor
- [ ] Empty state mesajı görünüyor (veri yokken)
- [ ] Modal açılıp kapanıyor
- [ ] Form submit sırasında butonlar disabled oluyor

---

## 🔄 Workflow

### Oluşturma Akışı
```
1. "Yeni Kalınlık" butonuna tıkla
2. Modal açılır
3. Formu doldur (cm, nameTr, coefficient)
4. "Oluştur" butonuna tıkla
5. POST /api/admin/thicknesses çağrılır
6. Başarı toastı gösterilir
7. Liste yeniden yüklenir
8. Modal kapanır
```

### Düzenleme Akışı
```
1. Tabloda "Düzenle" butonuna tıkla
2. Modal açılır (form dolu)
3. nameTr veya coefficient değiştir
4. "Güncelle" butonuna tıkla
5. PATCH /api/admin/thicknesses/[id] çağrılır
6. Başarı toastı gösterilir
7. Liste yeniden yüklenir
8. Modal kapanır
```

### Devre Dışı Bırakma Akışı
```
1. Tabloda "Devre Dışı Bırak" butonuna tıkla
2. Onay dialogu gösterilir
3. "Evet" seçeneğine tıkla
4. DELETE /api/admin/thicknesses/[id] çağrılır
5. Başarı toastı gösterilir
6. Liste yeniden yüklenir
7. Pasif varlık gri arka planla gösterilir
```

---

## 📚 Referanslar

- **PR #2**: F1+F2 Complete - Schema, Geometry, Pricing (PE API'leri)
- **PR #4**: Admin Panel RBAC Implementation
- **PR #5**: Admin Price Rules CRUD UI
- **PR #6**: Admin Stones Catalog CRUD UI
- **ADR-018**: AuditLog-based last updater tracking

---

## 🚀 Deployment Notları

### Gereksinimler
- Node.js 18+
- PostgreSQL (PR #2 schema migration)
- Next.js 14
- Prisma Client

### Environment Variables
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
```

### Migration
```bash
npx prisma migrate deploy
npx prisma generate
```

### Build
```bash
npm run build
npm start
```

---

## 🎓 Öğrenilen Dersler

1. **Kod Tekrarı**: 3 tab component benzer mantık içeriyor. İleride generic CatalogTab component'e refactor edilebilir.
2. **AuditLog Query**: Her varlık için ayrı query atılıyor. N+1 problem riski var, optimize edilebilir.
3. **Type Safety**: TypeScript ile API contract'ları garanti altında, runtime hataları azaldı.
4. **Turkish UX**: Tüm UI Türkçe, kullanıcı dostu.

---

## ✅ Tamamlanma Durumu

- [x] Admin API endpoints (6 adet)
- [x] TypeScript types
- [x] API client functions
- [x] Ana katalog sayfası
- [x] 3 tab component
- [x] CRUD işlevleri
- [x] 403 FORBIDDEN yönetimi
- [x] AuditLog entegrasyonu
- [x] Türkçe UI
- [x] PR oluşturuldu
- [x] Dokümantasyon tamamlandı

---

**Status:** ✅ TAMAMLANDI  
**PR Link:** https://github.com/reesullx57-hue/mermer/pull/7
