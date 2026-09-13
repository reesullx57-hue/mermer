import Link from 'next/link';
import { Check } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold text-white">Mermer</span>
            </Link>
            <Link href="/demo" className="btn-primary">
              Demo ile Başla
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Basit, Şeffaf Fiyatlandırma
          </h1>
          <p className="text-xl text-gray-400">
            Tüm özellikler dahil. Gizli ücret yok.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="card bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-800/50">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Profesyonel Plan</h3>
              <div className="flex items-baseline justify-center space-x-2">
                <span className="text-5xl font-bold text-white">₺3,999</span>
                <span className="text-gray-400">/ay</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">yaklaşık $149/ay</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                'Sınırsız proje',
                'Sınırsız plaka fotoğrafı',
                'Perspektif kalibrasyonu',
                'Damar eşleştirme editörü',
                '3D görüntüleme',
                'Müşteri onay linki',
                'DXF export',
                'Bulut depolama',
                'E-posta destek',
              ].map((feature, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <Check className="text-blue-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/demo" className="btn-primary w-full text-center block">
              14 Gün Ücretsiz Deneyin
            </Link>

            <p className="text-xs text-gray-500 text-center mt-4">
              Kredi kartı gerekmez • Her zaman iptal edebilirsiniz
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-white mb-8">Sık Sorulan Sorular</h3>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            {[
              {
                q: 'Ücretsiz deneme nasıl çalışır?',
                a: '14 gün boyunca tüm özelliklere tam erişim. Kredi kartı gerekmez. Deneme sonunda otomatik ücretlendirme yapılmaz.',
              },
              {
                q: 'İptal edebilir miyim?',
                a: 'Evet, istediğiniz zaman. Ücret iadesi yoktur ancak mevcut döneminiz sonuna kadar erişiminiz devam eder.',
              },
              {
                q: 'Fatura alabiliyor muyum?',
                a: 'Evet, her ay otomatik olarak düzgün fatura düzenlenir ve e-posta ile gönderilir.',
              },
            ].map((faq, i) => (
              <div key={i} className="card">
                <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
