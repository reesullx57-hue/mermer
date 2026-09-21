import { History } from 'lucide-react';

export default function AuditPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <History className="w-8 h-8 text-gray-600" />
          <h1 className="text-3xl font-bold text-gray-900">Denetim Kayıtları</h1>
        </div>
        <p className="text-gray-600">
          Sistem aktivite ve değişiklik kayıtları
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
          <li>Kullanıcı aktivite logları</li>
          <li>Veri değişiklik geçmişi</li>
          <li>Admin işlem kayıtları</li>
          <li>Giriş/çıkış logları</li>
          <li>Sistem olayları ve hatalar</li>
        </ul>
      </div>
    </div>
  );
}
