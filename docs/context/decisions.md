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

## ADR-029: Admin Denetim Kaydı UI Tasarımı

**Durum:** Kabul Edildi  
**Tarih:** 2026-09-21  
**Karar Veren:** Frontend Ekibi

### Bağlam

Admin paneli için kapsamlı bir denetim kaydı (audit log) arayüzü gereklidir. Sistem, kullanıcı aktivitelerini, veri değişikliklerini ve içe aktarma işlemlerini izleyecek ve ADMIN rolüne sahip kullanıcılara detaylı raporlama sunacaktır.

### Karar

`/admin/audit` sayfası aşağıdaki özellikleri içerecek şekilde geliştirilecektir:

#### Liste Görünümü
- **Kolonlar:** Tarih, Kullanıcı, İşlem (CREATE/UPDATE/DELETE/IMPORT), Varlık Tipi, Varlık ID, Özet, Detay
- **Sıralama:** createdAt DESC (en yeni kayıtlar üstte)
- **Sayfalama:** 50 kayıt/sayfa

#### Filtreleme
- Varlık tipi dropdown (Stone, PriceRule, ShippingRule, TaxRate, Discount, ImportJob vb.)
- Varlık ID arama (case-insensitive kısmi eşleşme)
- Kullanıcı dropdown
- Tarih aralığı (başlangıç/bitiş)
- İşlem tipi (CREATE/UPDATE/DELETE/IMPORT)

#### Detay Görünümü
- Modal popup ile açılır
- CREATE işlemleri için: Yalnızca "sonrası" JSON verisi
- DELETE işlemleri için: Yalnızca "öncesi" JSON verisi
- UPDATE işlemleri için: Yan yana "öncesi/sonrası" JSON karşılaştırması
  - Değişen alanlar sarı ile vurgulanır
  - Değişen alan listesi üstte gösterilir
- IMPORT işlemleri için: İçe aktarma yapılandırması ve istatistikler

#### ImportJob Özel İşleme
- Liste görünümünde ImportJob satırları için:
  - Başarı/hata rozeti (tüm başarılı = yeşil ✓, hatalar var = turuncu ⚠)
  - Toplam/başarılı/hata sayıları alt satırda gösterilir
- Detay görünümünde: İçe aktarma metrikleri ayrı bir bölümde vurgulanır

#### CSV Dışa Aktarma
- Filtrelenmiş liste CSV olarak indirilebilir
- Kolonlar: Tarih, Kullanıcı, İşlem, Varlık Tipi, Varlık ID, Özet
- Dosya adı: `denetim-kayitlari-YYYY-MM-DD.csv`

#### Güvenlik ve Erişim
- ADMIN layout içinde çalışır (otomatik RBAC koruması)
- API endpoint `/api/admin/audit` 403 FORBIDDEN döndüğünde UI'da hata mesajı gösterilir
- Metadata endpoint `/api/admin/audit/metadata` filtreleme dropdown'ları için kullanıcı ve varlık tipi listelerini sağlar

### Teknik Detaylar

- **Framework:** Next.js 15 (App Router)
- **UI Bileşenleri:** Client-side (`'use client'`) - interaktif filtreler ve modal için
- **Stil:** Tailwind CSS - mevcut admin panel tasarım sistemiyle tutarlı
- **İkonlar:** lucide-react (History, Search, Filter, Download, X, ChevronLeft, ChevronRight)
- **State Yönetimi:** React hooks (useState, useEffect, useCallback)
- **API İletişimi:** fetch API ile `/api/admin/audit` ve `/api/admin/audit/metadata`

#### Dosya Yapısı
```
app/admin/audit/
  ├── page.tsx              # Ana liste görünümü ve filtreleme
  └── AuditDetailModal.tsx  # Detay modal bileşeni
app/api/admin/audit/
  ├── route.ts              # Liste endpoint (GET)
  └── metadata/
      └── route.ts          # Metadata endpoint (GET)
```

### Sonuçlar

**Pozitif:**
- Kapsamlı aktivite takibi ve şeffaflık
- Güçlü filtreleme ve arama yetenekleri
- Değişikliklerin görsel karşılaştırması (diff highlighting)
- CSV dışa aktarma ile raporlama esnekliği
- ImportJob özel gösterimi ile toplu işlem görünürlüğü
- Türkçe arayüz - yerel kullanıcı deneyimi

**Negatif:**
- İlk sürüm mock data kullanır (backend AuditLog modeli gelecek sprint'te eklenecek)
- Büyük JSON nesneleri modal performansını etkileyebilir
- CSV dışa aktarma tarayıcı tarafında yapılır (büyük veri setleri için sunucu tarafı gerekebilir)

### Gelecek İyileştirmeler

1. Backend Prisma AuditLog modeli entegrasyonu
2. Gerçek zamanlı audit log akışı (WebSocket/SSE)
3. Gelişmiş JSON diff kütüphanesi (örn. `react-diff-viewer`)
4. Sunucu tarafında CSV oluşturma (büyük veri setleri için)
5. Audit log arşivleme ve saklama politikaları

### Referanslar

- İlgili sprint: F2 Frontend - Admin Audit UI
- ADR-015: Admin Panel RBAC (erişim kontrolü için)
- API Endpoint: `/api/admin/audit` (backend PE entegrasyonu bekleniyor)
