import { Tag } from 'lucide-react';

export default function PriceRulesPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Fiyat Kuralları</h1>
        </div>
        <p className="text-gray-600">
          Fiyatlandırma motoru kuralları ve yapılandırma
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
          <li>Alan bazlı fiyatlandırma kuralları</li>
          <li>Minimum sipariş tutarları</li>
          <li>Kesim karmaşıklığı çarpanları</li>
          <li>Özel kenar işleme ücretleri</li>
          <li>Müşteri grubu bazlı fiyatlandırma</li>
        </ul>
      </div>
    </div>
  );
}
