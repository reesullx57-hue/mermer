import { Percent } from 'lucide-react';

export default function DiscountsPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Percent className="w-8 h-8 text-pink-600" />
          <h1 className="text-3xl font-bold text-gray-900">İndirim Yönetimi</h1>
        </div>
        <p className="text-gray-600">
          Kampanya ve indirim kuralları yönetimi
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
          <li>Promosyon kodları oluşturma</li>
          <li>Yüzde ve sabit tutar indirimleri</li>
          <li>Geçerlilik tarihleri ve kullanım limitleri</li>
          <li>Müşteri grubu bazlı indirimler</li>
          <li>Toplu sipariş indirimleri</li>
        </ul>
      </div>
    </div>
  );
}
