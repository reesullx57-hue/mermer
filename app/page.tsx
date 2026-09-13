import Link from 'next/link';
import { ArrowRight, Camera, Ruler, Layout, Box, CheckCircle, Download } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold text-white">Mermer</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
                Fiyatlandırma
              </Link>
              <Link href="/features" className="text-gray-300 hover:text-white transition-colors">
                Özellikler
              </Link>
              <Link href="/faq" className="text-gray-300 hover:text-white transition-colors">
                SSS
              </Link>
              <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                İletişim
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                Giriş
              </Link>
              <Link href="/demo" className="btn-primary">
                Demo ile Başla
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Taş Yerleşimini Dijitalleştirin
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8">
              Telefon kameranızla plaka fotoğrafı çekin, damarları eşleştirin, 
              3D önizleyin ve CNC için hazır DXF çıktısı alın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/demo" className="btn-primary flex items-center space-x-2">
                <span>Ücretsiz Deneyin</span>
                <ArrowRight size={20} />
              </Link>
              <Link href="/pricing" className="btn-outline">
                Fiyatları İnceleyin
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              Kredi kartı gerekmez • 14 gün ücretsiz deneme • Her zaman iptal edebilirsiniz
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">
            Basit İş Akışı
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              { icon: Camera, title: 'Fotoğraf', desc: 'Plaka fotoğrafı çekin' },
              { icon: Ruler, title: 'Kalibrasyon', desc: '4 köşe işaretleyin' },
              { icon: Layout, title: 'Yerleşim', desc: 'Parçaları yerleştirin' },
              { icon: Box, title: '3D Önizleme', desc: 'Sonucu görün' },
              { icon: CheckCircle, title: 'Onay', desc: 'Müşteri onayı alın' },
              { icon: Download, title: 'Export', desc: 'DXF indirin' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <step.icon className="text-white" size={32} />
                </div>
                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Telefon Kamerasıyla Çalışır',
                desc: 'Pahalı tarayıcı donanımına gerek yok. Sadece telefonunuzla fotoğraf çekin.',
              },
              {
                title: 'Perspektif Düzeltme',
                desc: '4 nokta kalibrasyonu ile tam boyutlu ortografik görüntü elde edin.',
              },
              {
                title: 'Damar Eşleştirme',
                desc: 'Parçaları döndürün, çevirin ve bitişik kenarlarda damarları mükemmel şekilde eşleştirin.',
              },
              {
                title: 'İnteraktif 3D',
                desc: 'Yerleşimi 3D olarak görüntüleyin, döndürün ve sonucu müşteriye gösterin.',
              },
              {
                title: 'Müşteri Onayı',
                desc: 'Paylaşılabilir link gönderin, dijital imza alın ve tasarımı kilitleyin.',
              },
              {
                title: 'CNC Hazır DXF',
                desc: 'Onaylanan yerleşimi kalibrasyon boyutlarıyla tam DXF formatında indirin.',
              },
            ].map((feature, i) => (
              <div key={i} className="card">
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-800/50">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Bugün Başlayın
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              14 gün ücretsiz deneyin. Kredi kartı gerekmez.
            </p>
            <Link href="/demo" className="btn-primary inline-flex items-center space-x-2">
              <span>Demo ile Başla</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
                <span className="text-xl font-bold text-white">Mermer</span>
              </div>
              <p className="text-gray-400 text-sm">
                Taş atölyeleri için profesyonel yerleşim çözümü.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Ürün</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="text-gray-400 hover:text-white">Özellikler</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white">Fiyatlandırma</Link></li>
                <li><Link href="/demo" className="text-gray-400 hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Destek</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/faq" className="text-gray-400 hover:text-white">SSS</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white">İletişim</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Yasal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-gray-400 hover:text-white">Gizlilik</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white">Şartlar</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; 2026 Mermer. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
