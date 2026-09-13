# Mermer

**Taş atölyeleri için ücretsiz dijital yerleşim çözümü**

Mermer, mermer ve granit atölyelerinin plaka fotoğraflarını kalibre edip, şablon parçalarını yerleştirip, damarları eşleştirebileceği ve CNC için DXF çıktısı alabileceği tamamen ücretsiz bir web uygulamasıdır.

## 🚀 Özellikler

### ✅ Tam İşlevsel, Ücretsiz Uygulama

- **📸 Fotoğraf Tabanlı Kalibrasyon**: Telefon kamerasıyla çekilen plaka fotoğraflarını 4 nokta perspektif düzeltme ile kalibre edin
- **📐 Damar Eşleştirme**: Parçaları sürükleyin, döndürün, çevirin - her parça altındaki gerçek dokuyu gösterir
- **🎨 İnteraktif 3D Görüntüleme**: Three.js ile gerçekçi 3D önizleme, döndürme, zoom ve pan
- **📥 DXF Export**: Standart CNC uyumlu DXF formatında dosya indirme
- **🗃️ Proje Yönetimi**: Oluşturma, düzenleme, silme - tüm veriler SQLite ile kalıcı
- **🔐 Kimlik Doğrulama**: E-posta/şifre kaydı VEYA tek tıkla demo girişi
- **🎭 Demo Veri**: Sentetik mermer dokusu ve örnek parçalarla hazır demo projesi
- **💯 Tamamen Ücretsiz**: Sınırsız proje, sınırsız parça, tüm özellikler

### 🌐 Pazarlama Sitesi

- Açılış sayfası (iş akışı, özellikler, CTA)
- Özellikler detay sayfası
- SSS sayfası
- İletişim formu
- Gizlilik politikası
- Kullanım şartları
- Profesyonel, modern tasarım

## 🛠️ Teknoloji Stack'i

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Stil**: Tailwind CSS
- **Veritabanı**: Prisma + SQLite
- **3D**: Three.js + React Three Fiber
- **2D Editör**: HTML Canvas + SVG
- **Kimlik Doğrulama**: JWT + bcryptjs
- **DXF Export**: Özel DXF yazıcı (LWPOLYLINE)
- **Homografi**: Perspektif düzeltme algoritması

## 📦 Kurulum ve Çalıştırma

### Gereksinimler

- Node.js 18+ 
- npm veya yarn

### Adımlar

1. **Bağımlılıkları yükleyin**:
```bash
npm install
```

2. **Veritabanını oluşturun**:
```bash
npx prisma migrate dev
```

3. **Geliştirme sunucusunu başlatın**:
```bash
npm run dev
```

4. **Tarayıcıda açın**: [http://localhost:3000](http://localhost:3000)

### Üretim Build'i

```bash
npm run build
npm start
```

## 🎯 Kullanım Akışı

### 1️⃣ Giriş
- Ana sayfada "Hemen Başla" butonuna tıklayın
- VEYA "Kayıt Ol" ile kendi hesabınızı oluşturun

### 2️⃣ Demo Projesi İnceleyin
Demo girişi otomatik olarak örnek bir mutfak tezgahı projesi oluşturur:
- Sentetik mermer dokusu
- 2 örnek parça (ana tezgah + ada)
- Kalibrasyon verileri hazır

### 3️⃣ Kendi Projenizi Oluşturun
1. Dashboard'da "Yeni Proje" butonuna tıklayın
2. Proje adı girin
3. Plaka fotoğrafı yükleyin (telefon kameranızla çektiğiniz JPEG/PNG)

### 4️⃣ Kalibrasyon
1. Plaka fotoğrafında 4 köşeye tıklayın (sol üst, sağ üst, sağ alt, sol alt)
2. Gerçek plaka boyutlarını girin (mm veya inch)
3. "Kalibrasyonu Tamamla"

### 5️⃣ Parça Yerleşimi
1. "Parça Ekle" ile yeni parçalar ekleyin
2. Canvas üzerinde parçaları sürükleyin
3. "Döndür" (15° artışlarla) ve "Çevir" düğmeleriyle damarları eşleştirin
4. Zoom in/out ile detaylı kontrol
5. Parça listesinden seçim yaparak düzenleyin

### 6️⃣ 3D Önizleme
- "3D Önizleme" sekmesine geçin
- Fare ile döndürün, zoom yapın, kaydırın
- Yerleşimi üç boyutlu olarak inceleyin

### 7️⃣ DXF Export
- "DXF İndir" butonuna tıklayın
- Standart DXF dosyası indirilir
- Tüm parçalar kalibrasyon boyutlarına göre mutlak mm koordinatlarında
- CNC makinelerine direkt aktarılabilir

## 📁 Proje Yapısı

```
mermer/
├── app/                        # Next.js App Router
│   ├── api/                    # API routes
│   │   ├── auth/              # Login, register, demo, logout
│   │   ├── projects/          # CRUD operations
│   │   ├── upload/            # File upload
│   │   └── export/            # DXF export
│   ├── dashboard/             # Proje yönetimi
│   ├── project/[id]/          # Proje editörü
│   ├── login/                 # Login page
│   ├── register/              # Registration
│   ├── demo/                  # Demo auto-login
│   └── [marketing pages]      # Landing, features, etc.
├── components/                 # React bileşenleri
│   ├── editor/               # Calibration, Layout, 3D
│   └── [UI components]
├── lib/                       # Utilities
│   ├── auth.ts               # JWT
│   ├── homography.ts         # Perspektif
│   ├── dxf.ts               # Export
│   └── prisma.ts            # DB client
├── prisma/                   # Schema & migrations
├── public/                   # Statik dosyalar
└── scripts/                  # Yardımcı scriptler
```

## 🗄️ Veritabanı Şeması

### User
- E-posta, şifre (hash), ad
- İlişki: Birden fazla proje

### Project
- Ad, kullanıcı referansı
- Plaka fotoğrafı URL'si
- Plaka boyutları (genişlik, yükseklik mm)
- Kalibrasyon verileri (JSON: köşe noktaları, transform matrisi)
- İlişki: Birden fazla parça

### Piece
- Proje referansı
- Ad, tip (rectangle, L-shape, polygon, dxf)
- Geometri (JSON: noktalar dizisi)
- Pozisyon (x, y mm), rotasyon (derece), flip (boolean)
- Boyutlar (genişlik, yükseklik mm)
- Sıra indeksi

## 🔒 Güvenlik

- Şifreler bcrypt ile hash'lenir
- JWT token'lar HTTP-only cookie'lerde saklanır
- Her API route oturum kontrolü yapar
- Kullanıcılar sadece kendi projelerine erişebilir
- Dosya yüklemeleri proje ID ile ilişkilendirilir

## 🌍 Dil

- **Birincil**: Türkçe (tüm UI, marketing, labels)
- Kod yorumları ve değişken isimleri İngilizce
- İstenirse kolayca çevrilebilir yapı

## 🎨 Tasarım

- Koyu tema (dark mode)
- Modern B2B görünümü
- Gradyan aksan renkleri (mavi-mor-pembe)
- Masaüstü öncelikli editör, mobile-friendly marketing
- Lucide React ikonlar
- Tailwind utility sınıfları

## 🧪 Test Senaryosu

Bir değerlendirici şunları yapabilir:

1. ✅ Ana sayfayı ziyaret et → iş akışını gör
2. ✅ "Hemen Başla" → otomatik giriş
3. ✅ Örnek projeyi aç → kalibrasyon göster
4. ✅ "Parça Ekle" → sürükle, döndür, çevir
5. ✅ "3D Önizleme" → etkileşimli model
6. ✅ "DXF İndir" → CNC dosyası indir
7. ✅ Features, FAQ, legal sayfalarını ziyaret et

## 📝 Son Değişiklikler

### Kritik Buglar Düzeltildi
- **Bug 1**: Three.js SSR hatası düzeltildi - `View3D` artık `dynamic import` ile `ssr: false`
- **Bug 2**: Türkçe karakter sorunu düzeltildi - DXF dosya adları ASCII-safe sanitize ediliyor

### Özellik Kaldırıldı
- ❌ Fiyatlandırma/ödeme sistemi kaldırıldı - uygulama tamamen ücretsiz
- ❌ Müşteri onay/paylaşım akışı kaldırıldı
- ✅ DXF export her zaman kullanılabilir

## 🚧 Gelecek Geliştirmeler

- [ ] Gelişmiş DXF import (mevcut şablonları yükle)
- [ ] Çoklu plaka desteği (projede birden fazla plaka)
- [ ] Undo/Redo stack'i
- [ ] Keyboard shortcuts
- [ ] Proje şablonları
- [ ] Dosya boyutu sınırlamaları
- [ ] Gerçek SVD tabanlı homografi

## 📄 Lisans

Bu proje demo amaçlıdır. Üretim kullanımı için uygun lisans seçiniz.

## 📧 İletişim

Sorularınız için: destek@mermer.app

---

**2026 Mermer - Taş atölyeleri için ücretsiz yerleşim çözümü**
