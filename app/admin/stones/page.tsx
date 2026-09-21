import { Gem } from 'lucide-react';

export default function StonesPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gem className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Taş Yönetimi</h1>
        </div>
        <p className="text-gray-600">
          Mermer ve granit katalog yönetimi
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
          <li>Taş türleri yönetimi (Mermer, Granit, Kuvars vb.)</li>
          <li>Renk ve desen özellikleri</li>
          <li>Stok takibi ve envanter</li>
          <li>Fotoğraf ve görsel yönetimi</li>
          <li>Tedarikçi bilgileri</li>
        </ul>
      </div>
    </div>
  );
}
