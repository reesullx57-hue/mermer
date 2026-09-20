import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Gem,
  BookOpen,
  Tag,
  Truck,
  Receipt,
  Percent,
  Upload,
  History,
  LayoutDashboard,
  LogOut,
  Home,
} from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login?redirect=/admin');
  }

  if (session.role !== 'ADMIN') {
    redirect('/403');
  }

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Panel' },
    { href: '/admin/stones', icon: Gem, label: 'Taşlar' },
    { href: '/admin/catalog', icon: BookOpen, label: 'Katalog' },
    { href: '/admin/pricerules', icon: Tag, label: 'Fiyat Kuralları' },
    { href: '/admin/shipping', icon: Truck, label: 'Nakliye' },
    { href: '/admin/tax', icon: Receipt, label: 'Vergi' },
    { href: '/admin/discounts', icon: Percent, label: 'İndirimler' },
    { href: '/admin/import', icon: Upload, label: 'İçe Aktar' },
    { href: '/admin/audit', icon: History, label: 'Denetim' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Mermer Admin</h1>
            <p className="text-sm text-gray-500 mt-1">{session.email}</p>
          </div>

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors mb-2"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Ana Sayfa</span>
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-3 px-4 py-2.5 text-red-600 rounded-lg hover:bg-red-50 transition-colors w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Çıkış Yap</span>
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
