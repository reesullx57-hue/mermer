import { Receipt } from 'lucide-react';

export default function TaxPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Receipt className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Vergi Ayarları</h1>
        </div>
        <p className="text-gray-600">
          KDV ve diğer vergi oranları yönetimi
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
          <li>KDV oranı yapılandırması (varsayılan %20)</li>
          <li>İl bazlı vergi oranları</li>
          <li>Ürün kategorisi bazlı vergi kuralları</li>
          <li>Vergi muafiyeti tanımları</li>
          <li>Vergi raporları</li>
        </ul>
      </div>
    </div>
  );
}
