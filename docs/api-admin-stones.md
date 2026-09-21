# Admin Stones API Specification

Bu doküman F2 Sprint Stone Catalog CRUD UI için beklenen backend API sözleşmesini tanımlar.

## Genel Kurallar

### Kimlik Doğrulama ve Yetkilendirme

- Tüm endpoint'ler **ADMIN rolü** gerektirir
- Session cookie ile kimlik doğrulama (`next/headers` cookies)
- Yetkisiz erişimde ADR-017 uyarınca **HTTP 403 JSON** döner:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin role required"
  }
}
```

### AuditLog Pattern (ADR-018)

- Tüm CREATE/UPDATE/DELETE işlemleri `AuditLog` kaydı oluşturur
- "Son Güncelleyen" bilgisi AuditLog'dan sorgulanır
- Liste endpoint'leri `lastUpdater` içeren response döner

### Texture Upload (ADR-019)

- F2 stub: File input ile seçilen dosya adı `/local/textures/filename.jpg` formatında kaydedilir
- Backend `textureUrl` alanını nullable string olarak saklar
- Gerçek dosya yükleme F3+ sprint'inde tamamlanacak

---

## Entity Types

### StoneBrand

```typescript
interface StoneBrand {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

interface StoneBrandWithAudit extends StoneBrand {
  lastUpdater: {
    email: string;
    name: string | null;
    timestamp: string; // ISO 8601
  } | null;
}
```

### StoneCollection

```typescript
interface StoneCollection {
  id: string;
  brandId: string;
  brandName?: string; // For display
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoneCollectionWithAudit extends StoneCollection {
  lastUpdater: {
    email: string;
    name: string | null;
    timestamp: string;
  } | null;
}
```

### Stone

```typescript
interface Stone {
  id: string;
  collectionId: string;
  collectionName?: string; // For display
  brandName?: string; // For display
  name: string;
  textureUrl: string | null; // ADR-019: Local path or placeholder URL
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoneWithAudit extends Stone {
  lastUpdater: {
    email: string;
    name: string | null;
    timestamp: string;
  } | null;
}
```

### StoneColor

```typescript
interface StoneColor {
  id: string;
  stoneId: string;
  stoneName?: string; // For display
  name: string;
  m2Price: string; // Decimal string (e.g., "150.50")
  wastePercent: number | null; // Nullable
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoneColorWithAudit extends StoneColor {
  lastUpdater: {
    email: string;
    name: string | null;
    timestamp: string;
  } | null;
}
```

---

## Endpoints

### Stone Brands

#### GET /api/admin/stones/brands

Liste tüm markaları (AuditLog bilgisi ile).

**Response:**
```json
[
  {
    "id": "1",
    "name": "Marmara Mermer",
    "isActive": true,
    "createdAt": "2026-09-20T10:00:00.000Z",
    "updatedAt": "2026-09-20T11:00:00.000Z",
    "lastUpdater": {
      "email": "admin@demo.local",
      "name": "admin",
      "timestamp": "2026-09-20T11:00:00.000Z"
    }
  }
]
```

#### POST /api/admin/stones/brands

Yeni marka oluştur.

**Request:**
```json
{
  "name": "Yeni Marka",
  "isActive": true
}
```

**Response:** `201 Created` + `StoneBrandWithAudit`

#### PATCH /api/admin/stones/brands/:id

Markayı güncelle.

**Request:**
```json
{
  "name": "Güncellenmiş Marka",
  "isActive": false
}
```

**Response:** `200 OK` + `StoneBrandWithAudit`

#### DELETE /api/admin/stones/brands/:id

Markayı sil.

**Response:** `204 No Content`

---

### Stone Collections

#### GET /api/admin/stones/collections

Liste tüm koleksiyonları (marka adı ve AuditLog ile).

**Response:**
```json
[
  {
    "id": "1",
    "brandId": "1",
    "brandName": "Marmara Mermer",
    "name": "Klasik Serisi",
    "isActive": true,
    "createdAt": "2026-09-20T10:00:00.000Z",
    "updatedAt": "2026-09-20T11:00:00.000Z",
    "lastUpdater": {
      "email": "admin@demo.local",
      "name": "admin",
      "timestamp": "2026-09-20T11:00:00.000Z"
    }
  }
]
```

#### POST /api/admin/stones/collections

Yeni koleksiyon oluştur.

**Request:**
```json
{
  "brandId": "1",
  "name": "Premium Koleksiyon",
  "isActive": true
}
```

**Response:** `201 Created` + `StoneCollectionWithAudit`

#### PATCH /api/admin/stones/collections/:id

Koleksiyonu güncelle.

**Request:**
```json
{
  "brandId": "2",
  "name": "Güncellendi",
  "isActive": false
}
```

**Response:** `200 OK` + `StoneCollectionWithAudit`

#### DELETE /api/admin/stones/collections/:id

Koleksiyonu sil.

**Response:** `204 No Content`

---

### Stones

#### GET /api/admin/stones

Liste tüm taşları (koleksiyon, marka adı ve AuditLog ile).

**Response:**
```json
[
  {
    "id": "1",
    "collectionId": "1",
    "collectionName": "Klasik Serisi",
    "brandName": "Marmara Mermer",
    "name": "Beyaz Mermer",
    "textureUrl": "/local/textures/beyaz-mermer.jpg",
    "isActive": true,
    "createdAt": "2026-09-20T10:00:00.000Z",
    "updatedAt": "2026-09-20T11:00:00.000Z",
    "lastUpdater": {
      "email": "admin@demo.local",
      "name": "admin",
      "timestamp": "2026-09-20T11:00:00.000Z"
    }
  }
]
```

#### POST /api/admin/stones

Yeni taş oluştur.

**Request:**
```json
{
  "collectionId": "1",
  "name": "Yeni Taş",
  "textureUrl": "/local/textures/new-stone.jpg",
  "isActive": true
}
```

**Response:** `201 Created` + `StoneWithAudit`

#### PATCH /api/admin/stones/:id

Taşı güncelle.

**Request:**
```json
{
  "collectionId": "2",
  "name": "Güncellendi",
  "textureUrl": null,
  "isActive": false
}
```

**Response:** `200 OK` + `StoneWithAudit`

#### DELETE /api/admin/stones/:id

Taşı sil.

**Response:** `204 No Content`

---

### Stone Colors

#### GET /api/admin/stones/colors

Liste tüm renkleri (taş adı ve AuditLog ile).

**Response:**
```json
[
  {
    "id": "1",
    "stoneId": "1",
    "stoneName": "Beyaz Mermer",
    "name": "Kar Beyazı",
    "m2Price": "450.00",
    "wastePercent": 15,
    "isActive": true,
    "createdAt": "2026-09-20T10:00:00.000Z",
    "updatedAt": "2026-09-20T11:00:00.000Z",
    "lastUpdater": {
      "email": "admin@demo.local",
      "name": "admin",
      "timestamp": "2026-09-20T11:00:00.000Z"
    }
  }
]
```

#### POST /api/admin/stones/colors

Yeni renk oluştur.

**Request:**
```json
{
  "stoneId": "1",
  "name": "Gri Ton",
  "m2Price": "550.50",
  "wastePercent": 12.5,
  "isActive": true
}
```

**Response:** `201 Created` + `StoneColorWithAudit`

**Not:** `wastePercent` nullable - boş gönderilebilir:
```json
{
  "stoneId": "1",
  "name": "Özel Renk",
  "m2Price": "600.00",
  "wastePercent": null,
  "isActive": true
}
```

#### PATCH /api/admin/stones/colors/:id

Rengi güncelle.

**Request:**
```json
{
  "stoneId": "2",
  "name": "Güncellendi",
  "m2Price": "700.00",
  "wastePercent": 10,
  "isActive": false
}
```

**Response:** `200 OK` + `StoneColorWithAudit`

#### DELETE /api/admin/stones/colors/:id

Rengi sil.

**Response:** `204 No Content`

---

## Database Schema Önerisi

### Prisma Schema

```prisma
model StoneBrand {
  id          String           @id @default(uuid())
  name        String
  isActive    Boolean          @default(true)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  collections StoneCollection[]
}

model StoneCollection {
  id        String   @id @default(uuid())
  brandId   String
  brand     StoneBrand @relation(fields: [brandId], references: [id], onDelete: Cascade)
  name      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  stones    Stone[]
  
  @@index([brandId])
}

model Stone {
  id           String          @id @default(uuid())
  collectionId String
  collection   StoneCollection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  name         String
  textureUrl   String?         // ADR-019: Nullable texture URL
  isActive     Boolean         @default(true)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  colors       StoneColor[]
  
  @@index([collectionId])
}

model StoneColor {
  id           String   @id @default(uuid())
  stoneId      String
  stone        Stone    @relation(fields: [stoneId], references: [id], onDelete: Cascade)
  name         String
  m2Price      String   // Decimal as string (e.g., "150.50")
  wastePercent Float?   // Nullable
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([stoneId])
}

model AuditLog {
  id         String   @id @default(uuid())
  entityType String   // "STONE_BRAND", "STONE_COLLECTION", "STONE", "STONE_COLOR"
  entityId   String
  action     String   // "CREATE", "UPDATE", "DELETE"
  userId     String
  userName   String?
  userEmail  String
  changes    String?  // JSON
  createdAt  DateTime @default(now())
  
  @@index([entityType, entityId, action, createdAt])
}
```

---

## Frontend Integration Notes

### Error Handling

Frontend API client (`lib/api/stones.ts`) zaten ADR-017 uyumlu hata yönetimi içerir:

```typescript
export class StonesApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
  }
}

// 403 FORBIDDEN handling
if (err instanceof StonesApiError && err.code === 'FORBIDDEN') {
  showToast('Erişim reddedildi. Admin yetkisi gerekli.', 'error');
}
```

### AuditLog Query Optimization

Backend'de liste endpoint'leri için N+1 sorgu önlemek için JOIN kullanın:

```sql
-- Example for StoneBrand
SELECT 
  b.*,
  (
    SELECT JSON_OBJECT('email', a.userEmail, 'name', a.userName, 'timestamp', a.createdAt)
    FROM AuditLog a
    WHERE a.entityType = 'STONE_BRAND' 
      AND a.entityId = b.id 
      AND a.action = 'UPDATE'
    ORDER BY a.createdAt DESC
    LIMIT 1
  ) as lastUpdater
FROM StoneBrand b
```

### Turkish Labels

UI tamamen Türkçe:
- "Markalar" (Brands)
- "Koleksiyonlar" (Collections)
- "Taşlar" (Stones)
- "Renkler" (Colors)
- "Son Güncelleyen" (Last Updater)
- "Aktif" / "Pasif" (Active / Inactive)

---

## Testing

### Mock API

F2 sprint'inde mock API (`/workspace/app/api/admin/stones/*`) kullanılır:
- In-memory data store (`/workspace/lib/mock-data/stones.ts`)
- Tam CRUD işlemleri
- AuditLog simülasyonu
- ADR-017 ve ADR-018 uyumlu

### Backend Implementation Checklist

- [ ] Prisma schema ekle (StoneBrand, StoneCollection, Stone, StoneColor, AuditLog)
- [ ] Migration oluştur
- [ ] API endpoint'lerini mock API'den gerçek Prisma sorguları ile değiştir
- [ ] AuditLog JOIN optimizasyonu ekle
- [ ] Error handling (403 JSON per ADR-017)
- [ ] Session/auth validation
- [ ] Index'ler ekle (performans için)
- [ ] Cascade delete davranışlarını test et

---

## Referanslar

- **ADR-015:** Admin RBAC
- **ADR-017:** Admin API 403 JSON (No Redirect)
- **ADR-018:** AuditLog-based Last Updater
- **ADR-019:** Texture Upload F2 Stub
- **PR #4:** Admin Panel RBAC İmplementasyonu
- **PR #5:** Admin Price Rules CRUD UI (pattern referansı)
