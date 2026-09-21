import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold text-white">Mermer</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white mb-8">Gizlilik Politikası</h1>
        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p className="text-gray-400">Son güncelleme: Eylül 2026</p>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Topladığımız Bilgiler</h2>
            <p>
              Mermer kullanırken şu bilgileri topluyoruz:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Hesap bilgileri (e-posta, şifre)</li>
              <li>Proje verileri (plaka fotoğrafları, kalibrasyon verileri, yerleşim bilgileri)</li>
              <li>Kullanım istatistikleri (anonim)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Bilgilerin Kullanımı</h2>
            <p>Topladığımız bilgileri şu amaçlarla kullanırız:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Hizmet sunmak ve geliştirmek</li>
              <li>Müşteri desteği sağlamak</li>
              <li>Güvenlik ve dolandırıcılık önleme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Veri Güvenliği</h2>
            <p>
              Verileriniz şifrelenmiş olarak saklanır. Endüstri standardı güvenlik önlemleri kullanıyoruz.
              Verilerinizi üçüncü taraflarla paylaşmıyoruz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Çerezler</h2>
            <p>
              Oturum yönetimi için gerekli çerezler kullanıyoruz. Reklam veya izleme çerezleri kullanmıyoruz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Haklarınız</h2>
            <p>Verilerinize erişme, düzeltme veya silme hakkına sahipsiniz. Hesabınızı istediğiniz zaman silebilirsiniz.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. İletişim</h2>
            <p>Gizlilik ile ilgili sorularınız için: <a href="mailto:gizlilik@mermer.app" className="text-blue-400">gizlilik@mermer.app</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
