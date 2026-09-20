import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Users, FolderKanban, Gem, TrendingUp } from 'lucide-react';

export default async function AdminDashboard() {
  const session = await getSession();

  const [userCount, projectCount] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
  ]);

  const stats = [
    {
      title: 'Toplam Kullanıcı',
      value: userCount,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Toplam Proje',
      value: projectCount,
      icon: FolderKanban,
      color: 'bg-green-500',
    },
    {
      title: 'Taş Kataloğu',
      value: 'Yakında',
      icon: Gem,
      color: 'bg-purple-500',
    },
    {
      title: 'Aktif Siparişler',
      value: 'Yakında',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Yönetim Paneli</h1>
        <p className="text-gray-600 mt-2">
          Hoş geldiniz, {session?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">
                {stat.title}
              </h3>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Hızlı Erişim
          </h2>
          <div className="space-y-3">
            <a
              href="/admin/stones"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900">Taş Yönetimi</h3>
              <p className="text-sm text-gray-600 mt-1">
                Mermer ve granit katalog yönetimi
              </p>
            </a>
            <a
              href="/admin/pricerules"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900">Fiyatlandırma</h3>
              <p className="text-sm text-gray-600 mt-1">
                Fiyat kuralları ve yapılandırma
              </p>
            </a>
            <a
              href="/admin/import"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900">Veri İçe Aktarma</h3>
              <p className="text-sm text-gray-600 mt-1">
                CSV ve toplu veri yükleme
              </p>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Sistem Durumu
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Veritabanı
              </span>
              <span className="text-sm font-semibold text-green-600">
                Aktif
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                API Servisleri
              </span>
              <span className="text-sm font-semibold text-green-600">
                Aktif
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Fiyatlandırma Motoru
              </span>
              <span className="text-sm font-semibold text-yellow-600">
                Geliştirme Aşamasında
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          📋 Geliştirme Notları
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Admin paneli RBAC ile korunmaktadır</li>
          <li>Sadece ADMIN rolüne sahip kullanıcılar erişebilir</li>
          <li>Alt modüller şu anda geliştirme aşamasındadır</li>
          <li>Fiyatlandırma motoru ve katalog entegrasyonu yakında</li>
        </ul>
      </div>
    </div>
  );
}
