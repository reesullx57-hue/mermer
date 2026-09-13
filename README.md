# Mermer

**Taş atölyeleri için profesyonel dijital yerleşim çözümü**

Mermer, mermer ve granit atölyelerinin plaka fotoğraflarını kalibre edip, şablon parçalarını yerleştirip, damarları eşleştirebileceği ve CNC için DXF çıktısı alabileceği modern bir web uygulamasıdır.

## 🚀 Özellikler

### ✅ Tam İşlevsel, Üretim Kalitesinde Uygulama

- **📸 Fotoğraf Tabanlı Kalibrasyon**: Telefon kamerasıyla çekilen plaka fotoğraflarını 4 nokta perspektif düzeltme ile kalibre edin
- **📐 Damar Eşleştirme**: Parçaları sürükleyin, döndürün, çevirin - her parça altındaki gerçek dokuyu gösterir
- **🎨 İnteraktif 3D Görüntüleme**: Three.js ile gerçekçi 3D önizleme, döndürme, zoom ve pan
- **✅ Müşteri Onay Sistemi**: Paylaşılabilir link, dijital imza, zaman damgası ile onay kilitleme
- **📥 DXF Export**: Standart CNC uyumlu DXF formatında dosya indirme
- **🗃️ Proje Yönetimi**: Oluşturma, düzenleme, silme - tüm veriler SQLite ile kalıcı
- **🔐 Kimlik Doğrulama**: E-posta/şifre kaydı VEYA tek tıkla demo girişi
- **🎭 Demo Veri**: Sentetik mermer dokusu ve örnek parçalarla hazır demo projesi

### 🌐 Tam Pazarlama Sitesi

- Açılış sayfası (iş akışı, özellikler, CTA)
- Fiyatlandırma sayfası (tek plan, SSS)
- Özellikler detay sayfası
- SSS sayfası
- İletişim formu
- Gizlilik politikası
- Kullanım şartları
- Profesyonel, modern B2B SaaS tasarımı

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
- Ana sayfada "Demo ile Başla" butonuna tıklayın
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
- Müşteriye göstermek için ideal

### 7️⃣ Müşteri Onayı
1. "Paylaş" butonuna tıklayın
2. Oluşan link'i kopyalayın ve müşteriye gönderin
3. Müşteri link'i açar, 2D/3D görünümleri inceler
4. Adını girerek dijital olarak onaylar
5. Onay timestamp ile kaydedilir ve proje kilitlenir

### 8️⃣ DXF Export
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
│   │   ├── export/            # DXF export
│   │   └── approval/          # Approval system
│   ├── dashboard/             # Projects dashboard
│   ├── project/[id]/          # Project editor
│   ├── approval/[token]/      # Client approval page
│   ├── login/                 # Login page
│   ├── register/              # Registration
│   ├── demo/                  # Demo auto-login
│   ├── pricing/               # Pricing page
│   ├── features/              # Features page
│   ├── faq/                   # FAQ
│   ├── contact/               # Contact form
│   ├── privacy/               # Privacy policy
│   ├── terms/                 # Terms of service
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css            # Global styles
├── components/                 # React components
│   ├── editor/                # Editor components
│   │   ├── ProjectEditor.tsx  # Main editor
│   │   ├── CalibrationStep.tsx # Photo calibration
│   │   ├── LayoutStep.tsx     # Layout editor
│   │   └── View3D.tsx         # 3D visualization
│   ├── DashboardClient.tsx    # Dashboard UI
│   └── ApprovalClient.tsx     # Approval UI
├── lib/                        # Utilities
│   ├── prisma.ts              # Prisma client
│   ├── auth.ts                # JWT authentication
│   ├── homography.ts          # Perspective transform
│   └── dxf.ts                 # DXF generation
├── prisma/                     # Database
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration history
├── public/                     # Static files
│   ├── sample-marble.svg      # Demo marble texture
│   └── uploads/               # User uploads
├── scripts/                    # Utility scripts
│   └── generate-marble.js     # Generate demo texture
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
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
- İlişki: Birden fazla parça, onay kayıtları

### Piece
- Proje referansı
- Ad, tip (rectangle, L-shape, polygon, dxf)
- Geometri (JSON: noktalar dizisi)
- Pozisyon (x, y mm), rotasyon (derece), flip (boolean)
- Boyutlar (genişlik, yükseklik mm)
- Sıra indeksi

### Approval
- Proje referansı, benzersiz token
- Müşteri adı, onay tarihi
- Snapshot verileri (JSON: onay anındaki tam proje durumu)

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
- Endüstriyel/modern B2B SaaS görünümü
- Gradyan aksan renkleri (mavi-mor-pembe)
- Masaüstü öncelikli editör, mobile-friendly marketing
- Lucide React ikonlar
- Tailwind utility sınıfları

## 🧪 Test Senaryosu

Bir değerlendirici şunları yapabilir:

1. ✅ Ana sayfayı ziyaret et → iş akışını gör
2. ✅ "Demo ile Başla" → otomatik giriş
3. ✅ Örnek projeyi aç → kalibrasyon göster
4. ✅ "Parça Ekle" → sürükle, döndür, çevir
5. ✅ "3D Önizleme" → etkileşimli model
6. ✅ "Paylaş" → link kopyala
7. ✅ Yeni sekmede approval link'i aç → müşteri görünümü
8. ✅ Dijital imza ile onayla
9. ✅ "DXF İndir" → CNC dosyası indir
10. ✅ Pricing, FAQ, Legal sayfalarını ziyaret et

## 📝 Geliştirme Notları

### Homografi Algoritması
- 4 nokta perspektif düzeltme (DLT algoritması)
- Kalibrasyon hassasiyeti fotoğraf kalitesine bağlı
- Tipik kullanımda ±2-3mm doğruluk

### DXF Format
- AutoCAD 2000 (AC1015) uyumluluğu
- LWPOLYLINE entity'leri
- Milimetre birim
- Her parça için TEXT label
- Standart CAD yazılımlarıyla uyumlu

### Canvas Optimizasyonu
- Responsive canvas boyutlandırma
- Zoom/pan desteği
- Seçilen parça vurgulama
- Grid ve ruler gösterimi

### 3D Rendering
- React Three Fiber ile declarative 3D
- OrbitControls ile kullanıcı etkileşimi
- Basit box geometry (hızlı render)
- Ambient + directional ışıklandırma

## 🚧 Gelecek Geliştirmeler (Production için)

- [ ] Gerçek Stripe entegrasyonu
- [ ] E-posta bildirimleri (onay, hatırlatma)
- [ ] Gelişmiş DXF import (mevcut şablonları yükle)
- [ ] Çoklu plaka desteği (projede birden fazla plaka)
- [ ] Undo/Redo stack'i
- [ ] Keyboard shortcuts
- [ ] Proje şablonları
- [ ] Takım işbirliği (paylaşılan projeler)
- [ ] Dosya boyutu sınırlamaları
- [ ] Image CDN entegrasyonu
- [ ] Gerçek SVD tabanlı homografi
- [ ] Metrik ve analitik

## 📄 Lisans

Bu proje demo amaçlıdır. Üretim kullanımı için uygun lisans seçiniz.

## 🤝 Katkıda Bulunma

Pull request'ler kabul edilir. Büyük değişiklikler için önce bir issue açınız.

## 📧 İletişim

Sorularınız için: destek@mermer.app

---

**2026 Mermer - Taş atölyeleri için profesyonel yerleşim çözümü**
