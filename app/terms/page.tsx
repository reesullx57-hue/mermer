import Link from 'next/link';

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-white mb-8">Kullanım Şartları</h1>
        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p className="text-gray-400">Son güncelleme: Eylül 2026</p>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Hizmet Tanımı</h2>
            <p>
              Mermer, taş atölyeleri için dijital yerleşim ve kalibrasyon yazılımı sağlar.
              Hizmet "olduğu gibi" sunulur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Hesap Sorumluluğu</h2>
            <p>Siz şunlardan sorumlusunuz:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Hesap güvenliğini korumak</li>
              <li>Şifrenizi gizli tutmak</li>
              <li>Hesabınızdaki tüm aktiviteler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Kabul Edilebilir Kullanım</h2>
            <p>Hizmeti şu şekillerde kullanamazsınız:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Yasadışı amaçlarla</li>
              <li>Başkalarının haklarını ihlal ederek</li>
              <li>Sistemi manipüle ederek veya zarar vererek</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Ödeme ve İptal</h2>
            <p>
              Aylık abonelik ödemesi yapılır. İstediğiniz zaman iptal edebilirsiniz.
              İptal, mevcut fatura döneminin sonunda geçerli olur. İade yapılmaz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Fikri Mülkiyet</h2>
            <p>
              Oluşturduğunuz içeriğin (projeler, fotoğraflar) sahibi sizsiniz.
              Mermer yazılımının ve markasının sahibi biziz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Sorumluluk Sınırı</h2>
            <p>
              Mermer en iyi çabayı gösterir ancak hizmetin kesintisiz veya hatasız olacağını garanti etmez.
              Ölçüm hassasiyeti fotoğraf kalitesine bağlıdır. Kritik uygulamalarda ölçümleri doğrulayın.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Değişiklikler</h2>
            <p>
              Bu şartları istediğimiz zaman güncelleyebiliriz. Önemli değişiklikler için e-posta ile bildirim yaparız.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. İletişim</h2>
            <p>Sorularınız için: <a href="mailto:destek@mermer.app" className="text-blue-400">destek@mermer.app</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
