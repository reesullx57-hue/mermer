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
