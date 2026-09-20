import { BookOpen } from 'lucide-react';

export default function CatalogPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Katalog Yönetimi</h1>
        </div>
        <p className="text-gray-600">
          Ürün kataloğu ve ürün bilgileri yönetimi
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
          <li>Ürün listesi ve detayları</li>
          <li>Kategori yönetimi</li>
          <li>Ürün özellikleri ve varyantlar</li>
          <li>Görsel galeri yönetimi</li>
          <li>Ürün durumu (aktif/pasif)</li>
        </ul>
      </div>
    </div>
  );
}
