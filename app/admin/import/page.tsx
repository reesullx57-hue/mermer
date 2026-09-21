import { Upload } from 'lucide-react';

export default function ImportPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Upload className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Veri İçe Aktarma</h1>
        </div>
        <p className="text-gray-600">
          CSV ve toplu veri yükleme araçları
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-900 mb-2">
          🚧 Geliştirme Aşamasında
        </h3>
        <p className="text-yellow-800 mb-4">
          Bu modül şu anda geliştirilmektedir. Aşağıdaki özellikler eklenecektir:
        </p>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>CSV formatında taş kataloğu yükleme</li>
          <li>Toplu ürün ekleme/güncelleme</li>
          <li>Fiyat listesi içe aktarma</li>
          <li>Şablon indirme</li>
          <li>İçe aktarma geçmişi ve hata raporları</li>
        </ul>
      </div>
    </div>
  );
}
