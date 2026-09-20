# Architecture Decision Records (ADRs)

Bu dosya Mermer projesi için mimari kararları içerir.

---

## ADR-015: Admin Panel RBAC (Role-Based Access Control)

**Durum:** Kabul Edildi  
**Tarih:** 2026-09-20  
**Karar Veren:** Ürün Sahibi

### Bağlam

Mermer uygulaması için yönetim paneli (admin paneli) gerektirmektedir. Bu panel, taş katalog yönetimi, fiyatlandırma kuralları, nakliye ve vergi ayarları gibi hassas iş operasyonlarını içerecektir. Bu işlevlerin yalnızca yetkili personel tarafından erişilebilir olması kritik öneme sahiptir.

### Karar

`/admin/*` altındaki tüm rotalar yalnızca ADMIN rolüne sahip kullanıcılar tarafından erişilebilir olacaktır. Bu kısıtlama:

1. **Next.js Middleware** seviyesinde uygulanacak - kimliği doğrulanmamış kullanıcılar login sayfasına yönlendirilir
2. **Server Component Guard** ile desteklenecek - ADMIN olmayan kullanıcılar 403 Forbidden hatası alır veya ana sayfaya yönlendirilir
3. Prisma şemasında mevcut `Role` enum kullanılacak: `ADMIN | DEALER | USER`
4. Oturum verileri kullanıcının rolünü içerecek şekilde genişletilecek

### Roller

- **ADMIN**: Tam admin panel erişimi (`/admin/*`)
- **DEALER**: Bayii portalı erişimi (gelecek sprint)
- **USER**: Standart kullanıcı - proje ve taş kesim işlemleri

### Sonuçlar

**Pozitif:**
- Açık erişim kontrolü ve güvenlik
- Rol tabanlı özellik geliştirme için temel altyapı
- Middleware + server guard ile çift katmanlı koruma

**Negatif:**
- Oturum yönetimi ek karmaşıklık gerektirir (role bilgisi)
- Rol değişikliklerinde oturum yenileme gerekebilir

### Teknik Detaylar

- JWT oturum yükü `role` alanı içerecek
- Middleware `/admin` rotalarını koruyacak
- Admin layout sunucu bileşeninde rol doğrulaması yapacak
- Demo/seed verilerinde admin@demo.local kullanıcısı ADMIN rolüyle oluşturulacak

### Referanslar

- İlgili sprint: F2 Frontend - Admin Layout & RBAC
- Prisma Schema: `Role` enum tanımı
- Next.js Middleware: `middleware.ts`

---

## ADR-017: Admin API 403 JSON Response (No Redirect)

**Durum:** Kabul Edildi  
**Tarih:** 2026-09-20  
**Karar Veren:** Ürün Sahibi

### Bağlam

Admin API endpoint'leri yetkilendirme hatalarını nasıl ele alacağını belirtmek gerekir. Frontend'de dialog/toast bildirimleri ile hata gösterimi için API'nin JSON yanıt döndürmesi gerekir.

### Karar

Admin API rotaları (`/api/admin/*`) yetkilendirme hatalarında **HTTP 307 redirect değil, HTTP 403 JSON yanıtı** dönecektir:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin role required"
  }
}
```

### Nedeni

- Frontend API client'ı hata mesajını toast/dialog ile gösterir
- Redirect kullanıcıyı beklenmedik sayfalara götürür
- RESTful API prensipleri JSON hata yanıtı önerir
- Frontend'de programatik hata yönetimi gerekir

### Sonuçlar

**Pozitif:**
- Temiz API hata yönetimi
- Frontend toast/dialog bildirimleri
- RESTful best practices

**Negatif:**
- API route'ları manuel 403 JSON yanıtı döndürmelidir

### Referanslar

- İlgili ADR: ADR-015 (Admin RBAC)
- Frontend: `lib/api/pricerules.ts` hata yönetimi

---

## ADR-018: Admin "Son Güncelleyen" Bilgisi AuditLog'dan Gelir

**Durum:** Kabul Edildi  
**Tarih:** 2026-09-20  
**Karar Veren:** Ürün Sahibi

### Bağlam

Admin panelinde fiyat kuralları ve diğer kritik veri değişikliklerinde "son güncelleyen" bilgisini (kullanıcı ve tarih) göstermek gerekir. Bu bilgiyi saklamak için iki yaklaşım mevcut:

1. Her entity'de `updatedBy` alanı tutmak (örn: `PriceRule.updatedBy`)
2. `AuditLog` tablosundan fetch etmek

### Karar

**Admin panelinde "son güncelleyen" bilgisi `AuditLog` tablosundan alınacaktır.**

İlgili entity için en son `UPDATE` action'ı içeren AuditLog kaydı sorgulanacak ve `userId` üzerinden kullanıcı bilgisi fetch edilecektir.

### Nedeni

1. **Tek Kaynak Prensibi:** AuditLog zaten tüm değişiklikleri kaydediyor, aynı bilgiyi entity'de duplike tutmaya gerek yok
2. **Tam Tarihçe:** AuditLog tüm değişiklikleri saklar, sadece son değil
3. **Genişletilebilirlik:** Tüm admin entity'leri için tek pattern
4. **Bütünlük:** AuditLog kaydı yoksa "son güncelleyen" boş kalır, bu beklenebilir
5. **Esneklik:** İleride "kim, ne zaman, ne değiştirdi" detayları gösterilebilir

### Uygulama Detayları

**Frontend API çağrısı:**
```typescript
// GET /api/admin/pricerules/:id/audit/latest
// Döner: { userId, userName, userEmail, timestamp, changes }
```

**Backend sorgu:**
```sql
SELECT * FROM AuditLog 
WHERE entityType = 'PRICE_RULE' 
  AND entityId = :id 
  AND action = 'UPDATE'
ORDER BY createdAt DESC 
LIMIT 1
```

**UI Görüntüleme:**
- Liste görünümü: Son güncelleyen email + tarih
- Detay görünümü: Son güncelleyen + tüm değişiklik tarihçesi (gelecek)

### Sonuçlar

**Pozitif:**
- Tek kaynak, tutarlı veri
- Tam değişiklik tarihçesi potansiyeli
- Entity şemalarına `updatedBy` eklemeye gerek yok
- Tüm admin entity'ler için standart pattern

**Negatif:**
- İlave API çağrısı gerekir (N+1 sorgu potansiyeli - çözüm: batch/join)
- AuditLog kaydı yoksa boş görünür
- Hafif performans maliyeti (index ile minimize edilir)

**Performans Optimizasyonu:**
- Liste görünümü: JOIN ile tek sorguda tüm AuditLog'lar çekilir
- Index: `AuditLog(entityType, entityId, action, createdAt DESC)`

### Alternatifler

**Değerlendirildi ve Reddedildi:**
- `PriceRule.updatedBy` alanı: Veri duplikasyonu, AuditLog ile senkronizasyon riski

### Referanslar

- İlgili sprint: F2 Gate 2 - Admin Price Rules UI
- İlgili ADR: ADR-015 (Admin RBAC), ADR-017 (API 403 JSON)
- Backend: Pricing Engine - AuditLog schema ve service

---

## ADR-019: Texture Upload F2 Stub (Local Path Placeholder)

**Durum:** Kabul Edildi  
**Tarih:** 2026-09-20  
**Karar Veren:** Ürün Sahibi

### Bağlam

F2 sprint kapsamında taş kataloğu yönetimi için doku (texture) görseli yükleme özelliği gereklidir. Ancak tam dosya yükleme altyapısı (S3, CDN, image processing) daha sonraki bir sprint'te tamamlanacaktır.

### Karar

**F2 sprint'inde texture upload "stub" olarak uygulanacaktır:**

1. Frontend'de file input kullanılacak
2. Seçilen dosya adı yerel yol formatında kaydedilecek (örn: `/local/textures/filename.jpg`)
3. Backend API texture URL'ini string olarak kabul edip saklar
4. Gerçek dosya yükleme yapılmaz - sadece placeholder path kaydedilir

### Uygulama Detayları

**Frontend:**
```typescript
function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (file) {
    const localPath = `/local/textures/${file.name}`;
    setFormData({ ...formData, textureUrl: localPath });
    showToast(`Dosya seçildi: ${file.name} (F2 stub - yerel yol)`, 'success');
  }
}
```

**Backend:**
```typescript
interface Stone {
  textureUrl: string | null; // Nullable string
}
```

**Örnek Değerler:**
- `/local/textures/white-marble.jpg`
- `/placeholder/textures/black-granite.png`
- `null` (doku yüklenmedi)

### Nedeni

1. **Sprint Kapsamı:** Tam dosya yükleme F2 sprint dışında
2. **UI Testi:** Frontend form ve flow test edilebilir
3. **API Contract:** Backend API zaten string URL kabul ediyor
4. **Hızlı İterasyon:** Gerçek yükleme altyapısı beklenmeden UI tamamlanır
5. **Temiz Geçiş:** İleride gerçek URL'ler aynı alan kullanılacak

### Gelecek Uygulama (F3+)

Tam dosya yükleme özelliği:
1. Multipart form data ile dosya yükleme
2. S3 veya benzeri object storage
3. Image processing (resize, optimize, format conversion)
4. CDN distribution
5. `textureUrl` alanında gerçek public URL

### Sonuçlar

**Pozitif:**
- F2 sprint için UI tamamlanır
- API contract değişmez
- Test edilebilir form flow

**Negatif:**
- Gerçek görsel önizleme yapılamaz (F2 limitasyonu)
- Manuel veri temizliği gerekebilir (placeholder path'ler)

### Kullanıcı Bilgilendirmesi

Frontend'de dosya seçimi sonrası gösterilecek mesaj:
> "F2 stub: Dosya yerel yol olarak kaydedilir. Gerçek yükleme daha sonra eklenecek."

### Referanslar

- İlgili sprint: F2 Frontend - Stone Catalog CRUD
- İlgili ADR: ADR-018 (AuditLog last updater)
- Backend: Stone entity schema
