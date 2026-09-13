import Link from 'next/link';
import { Mail, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold text-white">Mermer</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center">
          İletişim
        </h1>
        <p className="text-xl text-gray-400 text-center mb-16">
          Sorularınız mı var? Size yardımcı olmaktan mutluluk duyarız.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="card text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Mail className="text-white" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">E-posta</h3>
            <p className="text-gray-400 mb-4">
              Bize e-posta gönderin, 24 saat içinde yanıt veriyoruz.
            </p>
            <a href="mailto:destek@mermer.app" className="text-blue-400 hover:text-blue-300">
              destek@mermer.app
            </a>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
              <MessageSquare className="text-white" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Canlı Destek</h3>
            <p className="text-gray-400 mb-4">
              Mesai saatleri içinde anında yardım alın.
            </p>
            <p className="text-gray-500 text-sm">Pazartesi - Cuma, 09:00 - 18:00</p>
          </div>
        </div>

        <div className="mt-16 card">
          <h3 className="text-2xl font-semibold text-white mb-6 text-center">
            İletişim Formu
          </h3>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Adınız
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Adınız Soyadınız"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                E-posta
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="ornek@firma.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mesajınız
              </label>
              <textarea
                className="input-field"
                rows={6}
                placeholder="Mesajınızı buraya yazın..."
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Gönder
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
