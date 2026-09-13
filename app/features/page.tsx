import Link from 'next/link';

export default function FeaturesPage() {
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

      <div className="max-w-5xl mx-auto px-4 py-20">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center">
          Güçlü Özellikler
        </h1>
        <p className="text-xl text-gray-400 text-center mb-16">
          Taş işleme iş akışınızı dijitalleştirin ve hızlandırın.
        </p>

        <div className="space-y-8">
          {[
            {
              title: 'Fotoğraf Tabanlı Kalibrasyon',
              desc: 'Herhangi bir telefon kamerasıyla plaka fotoğrafı çekin. 4 köşe noktasını işaretleyin ve gerçek boyutları girin. Yazılım perspektif bozulmalarını düzeltir ve tam ortografik görüntü oluşturur.',
            },
            {
              title: 'Damar Eşleştirme Editörü',
              desc: 'Şablon parçalarını sürükleyin, döndürün ve çevirin. Her parça altındaki gerçek plaka dokusunu gösterir, bitişik kenarlarda kusursuz damar eşleştirmesi yapmanızı sağlar.',
            },
            {
              title: 'İnteraktif 3D Görüntüleme',
              desc: 'Yerleşimi üç boyutlu olarak görüntüleyin. Modeli döndürün, yakınlaştırın. Müşterilere gerçekçi önizleme gösterin.',
            },
            {
              title: 'Müşteri Onay Sistemi',
              desc: 'Proje için paylaşılabilir link oluşturun. Müşteri tasarımı inceler, 2D ve 3D görünümleri kontrol eder, dijital imza ile onaylar. Onaylanan tasarım kilitlenir.',
            },
            {
              title: 'CNC Hazır DXF Export',
              desc: 'Onaylanan yerleşimi standart DXF formatında indirin. Tüm parçalar kalibrasyon boyutlarına göre mutlak milimetre koordinatlarında. Direkt CNC makinelerine aktarabilirsiniz.',
            },
            {
              title: 'Proje Yönetimi',
              desc: 'Tüm projelerinizi tek yerde saklayın. Proje oluşturun, yeniden adlandırın, silin. Her proje fotoğraf, kalibrasyon, yerleşim ve onay durumunu içerir.',
            },
          ].map((feature, i) => (
            <div key={i} className="card">
              <h3 className="text-2xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
