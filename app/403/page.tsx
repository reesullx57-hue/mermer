import Link from 'next/link';

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="text-8xl font-bold text-red-600 mb-4">403</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Erişim Engellendi
          </h1>
          <p className="text-gray-600 mb-8">
            Bu sayfaya erişim yetkiniz bulunmamaktadır. Yönetici paneline yalnızca yetkili personel erişebilir.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Ana Sayfaya Dön
          </Link>
          <Link
            href="/login"
            className="block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Farklı Hesapla Giriş Yap
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Yetkili olduğunuzu düşünüyorsanız lütfen sistem yöneticinizle iletişime geçin.</p>
        </div>
      </div>
    </div>
  );
}
