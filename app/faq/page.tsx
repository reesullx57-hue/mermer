import Link from 'next/link';

export default function FAQPage() {
  const faqs = [
    {
      q: 'Mermer nasıl çalışır?',
      a: 'Telefonunuzla plakanın fotoğrafını çekin, 4 köşeyi işaretleyerek gerçek boyutları belirtin. Sistem perspektif düzeltmesi yapar. Ardından şablon parçalarını yerleştirip damarları eşleştirin, 3D önizleyin ve CNC için DXF indirin.',
    },
    {
      q: 'Mermer ücretli mi?',
      a: 'Hayır, Mermer tamamen ücretsizdir. Sınırsız proje, sınırsız parça, tüm özellikler. Gizli ücret veya abonelik yok.',
    },
    {
      q: 'Hangi cihazlarla kullanabilirim?',
      a: 'Masaüstü bilgisayar veya tablet tarayıcısında editörü kullanın. Plaka fotoğrafı için herhangi bir akıllı telefon kamerası yeterli.',
    },
    {
      q: 'DXF dosyası hangi formatta?',
      a: 'Standart AutoCAD DXF formatında, LWPOLYLINE geometrileri ile. Çoğu CNC yazılımı ile uyumludur. Koordinatlar milimetre cinsindendir.',
    },
    {
      q: 'Kalibrasyonun doğruluğu nedir?',
      a: 'Fotoğraf kalitesi ve köşe işaretleme hassasiyetine bağlıdır. Tipik kullanımda ±2-3mm doğruluk beklenir. Kritik boyutlar için CNC yazılımınızda ince ayar yapabilirsiniz.',
    },
    {
      q: 'Birden fazla plaka kullanabilir miyim?',
      a: 'Evet, her proje birden fazla plaka fotoğrafı içerebilir. Parçaları farklı plakalara yerleştirebilirsiniz.',
    },
    {
      q: 'Mevcut DXF şablonlarımı yükleyebilir miyim?',
      a: 'Evet, DXF formatındaki mevcut şablonlarınızı doğrudan yükleyebilir ve plakaya yerleştirebilirsiniz.',
    },
    {
      q: 'Verilerim güvende mi?',
      a: 'Evet, tüm veriler şifrelenmiş olarak saklanır. Projeleriniz ve fotoğraflarınız sadece sizin hesabınızdan erişilebilir.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold text-white">Mermer</span>
            </Link>
            <Link href="/demo" className="btn-primary">Demo ile Başla</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center">
          Sık Sorulan Sorular
        </h1>
        <p className="text-xl text-gray-400 text-center mb-16">
          Mermer hakkında merak ettikleriniz.
        </p>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="card">
              <h3 className="text-xl font-semibold text-white mb-3">{faq.q}</h3>
              <p className="text-gray-400">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">Başka bir sorunuz mu var?</p>
          <Link href="/contact" className="btn-primary inline-block">
            İletişime Geçin
          </Link>
        </div>
      </div>
    </div>
  );
}
