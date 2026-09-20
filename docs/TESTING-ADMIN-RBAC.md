# Admin RBAC Testing Guide

Bu belge, F2 Sprint'inde eklenen Admin Panel RBAC özelliğinin nasıl test edileceğini açıklar.

## Kurulum

### 1. Veritabanı Migrasyon

Yeni Role enum'ını eklemek için Prisma migrasyonu çalıştırın:

```bash
npx prisma migrate dev --name add-role-enum
```

### 2. Test Kullanıcıları Oluşturma

Admin, dealer ve normal kullanıcı test hesapları oluşturmak için seed script'ini çalıştırın:

```bash
npx tsx scripts/seed-admin.ts
```

Bu script aşağıdaki kullanıcıları oluşturur:

- **ADMIN**: `admin@demo.local` / `admin123`
- **DEALER**: `dealer@demo.local` / `admin123`
- **USER**: `user@demo.local` / `admin123`

## Test Senaryoları

### ✅ Test 1: Admin Kullanıcı Erişimi

1. `admin@demo.local` ile giriş yapın
2. `/admin` rotasına gidin
3. **Beklenen Sonuç**: Admin paneline erişebilmelisiniz
4. Sol menüden tüm admin bölümlerine (Taşlar, Katalog, vb.) erişebildiğinizi doğrulayın

### ✅ Test 2: Dealer Kullanıcı Engelleme

1. `dealer@demo.local` ile giriş yapın
2. `/admin` rotasına manuel olarak gitmeyi deneyin (URL'ye yazarak)
3. **Beklenen Sonuç**: 403 Forbidden sayfasına yönlendirilmelisiniz
4. "Erişim Engellendi" mesajını görmelisiniz

### ✅ Test 3: Normal Kullanıcı Engelleme

1. `user@demo.local` ile giriş yapın
2. `/admin` rotasına manuel olarak gitmeyi deneyin
3. **Beklenen Sonuç**: 403 Forbidden sayfasına yönlendirilmelisiniz

### ✅ Test 4: Kimlik Doğrulaması Olmadan Erişim

1. Oturumu kapatın (logout)
2. `/admin` rotasına gitmeyi deneyin
3. **Beklenen Sonuç**: Login sayfasına yönlendirilmelisiniz
4. Login sonrası `/admin` sayfasına yönlendirilmelisiniz

### ✅ Test 5: Admin Alt Sayfaları

Admin olarak giriş yapıp aşağıdaki sayfaların erişilebilir olduğunu doğrulayın:

- `/admin` - Ana panel
- `/admin/stones` - Taş Yönetimi
- `/admin/catalog` - Katalog
- `/admin/pricerules` - Fiyat Kuralları
- `/admin/shipping` - Nakliye
- `/admin/tax` - Vergi
- `/admin/discounts` - İndirimler
- `/admin/import` - İçe Aktar
- `/admin/audit` - Denetim

## Teknik Detaylar

### Middleware Koruması

`middleware.ts` dosyası `/admin/*` rotalarını korur:
- Kimlik doğrulaması kontrolü
- ADMIN rolü kontrolü
- Yetkisiz kullanıcıları yönlendirme

### Server Component Guard

`app/admin/layout.tsx` sunucu bileşeni:
- Session'dan role bilgisi alır
- ADMIN olmayan kullanıcıları engeller
- Çift katmanlı koruma sağlar

### JWT Token Yapısı

Token payload şu alanları içerir:
```typescript
{
  userId: string;
  email: string;
  role: 'ADMIN' | 'DEALER' | 'USER';
}
```

## Sorun Giderme

### "Role" alanı bulunamadı hatası

Prisma migration çalıştırmayı unutmadığınızdan emin olun:

```bash
npx prisma migrate dev
npx prisma generate
```

### 401 Unauthorized hatası

Token'ınız güncel olmayabilir. Logout yapıp tekrar login olun.

### Admin paneli görünmüyor

Seed script'ini çalıştırdığınızdan ve admin kullanıcı ile login olduğunuzdan emin olun.

## İlgili Dosyalar

- `docs/context/decisions.md` - ADR-015
- `middleware.ts` - Route koruma
- `app/admin/layout.tsx` - Admin layout ve guard
- `prisma/schema.prisma` - Role enum
- `lib/auth.ts` - Session yönetimi
- `scripts/seed-admin.ts` - Test kullanıcıları
