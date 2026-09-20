import { Truck } from 'lucide-react';

export default function ShippingPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Truck className="w-8 h-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Nakliye Ayarları</h1>
        </div>
        <p className="text-gray-600">
          Kargo ve teslimat seçenekleri yönetimi
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
          <li>Nakliye bölgeleri ve ücretleri</li>
          <li>Mesafe bazlı fiyatlandırma</li>
          <li>Ücretsiz kargo eşik değerleri</li>
          <li>Teslimat süreleri</li>
          <li>Özel teslimat seçenekleri</li>
        </ul>
      </div>
    </div>
  );
}
