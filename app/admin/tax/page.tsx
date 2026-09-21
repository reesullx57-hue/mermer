'use client';

import { useEffect, useState } from 'react';
import { Receipt, Edit2, Loader2, AlertCircle, Save } from 'lucide-react';
import type { TaxConfigWithAudit, UpdateTaxConfigRequest } from '@/lib/types/tax';
import { fetchTaxConfig, updateTaxConfig, TaxApiError } from '@/lib/api/tax';
import { showToast, ToastContainer } from '@/components/Toast';

export default function TaxPage() {
  const [config, setConfig] = useState<TaxConfigWithAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vatRate, setVatRate] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTaxConfig();
      setConfig(data);
      setVatRate(data.vatRate);
    } catch (err) {
      if (err instanceof TaxApiError) {
        if (err.code === 'FORBIDDEN') {
          setError('Erişim reddedildi. Admin yetkisi gerekli.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Vergi yapılandırması yüklenirken bir hata oluştu.');
      }
      console.error('Failed to load tax config:', err);
    } finally {
      setLoading(false);
    }
  }

  function startEditing() {
    setEditing(true);
    if (config) {
      setVatRate(config.vatRate);
    }
  }

  function cancelEditing() {
    setEditing(false);
    if (config) {
      setVatRate(config.vatRate);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const request: UpdateTaxConfigRequest = {
        vatRate: vatRate,
      };
      const updated = await updateTaxConfig(request);
      setConfig(updated);
      setEditing(false);
      showToast('KDV oranı başarıyla güncellendi.', 'success');
    } catch (err) {
      if (err instanceof TaxApiError) {
        if (err.code === 'FORBIDDEN') {
          showToast('Erişim reddedildi. Admin yetkisi gerekli.', 'error');
        } else {
          showToast(err.message, 'error');
        }
      } else {
        showToast('İşlem sırasında bir hata oluştu.', 'error');
      }
      console.error('Update error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  function formatVatRateDisplay(rate: string): string {
    const numRate = parseFloat(rate);
    if (isNaN(numRate)) return rate;
    return `%${(numRate * 100).toFixed(2)}`;
  }

  return (
    <div>
      <ToastContainer />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Receipt className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Vergi Ayarları</h1>
        </div>
        <p className="text-gray-600">
          KDV ve diğer vergi oranları yönetimi
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Hata</h3>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && config && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Türkiye KDV Yapılandırması</h2>
            <p className="text-sm text-gray-600 mt-1">VAT_TR vergi tipi</p>
          </div>

          <div className="p-6">
            {!editing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KDV Oranı
                  </label>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        {formatVatRateDisplay(config.vatRate)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 font-mono">
                        Ondalık değer: {config.vatRate}
                      </div>
                    </div>
                    <button
                      onClick={startEditing}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Düzenle
                    </button>
                  </div>
                </div>

                {config.lastUpdater && (
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Son Güncelleme</h3>
                    <div className="text-sm text-gray-600">
                      <div>{new Date(config.lastUpdater.timestamp).toLocaleString('tr-TR')}</div>
                      <div className="text-gray-500 mt-1">{config.lastUpdater.email}</div>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Kullanım Notu</h3>
                  <p className="text-sm text-gray-600">
                    KDV oranı ondalık sayı formatında saklanır. Örneğin, %20 için &quot;0.2000&quot; 
                    veya &quot;0.20&quot; gibi bir değer kullanılır. %18 için &quot;0.18&quot; girilmelidir.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KDV Oranı (Ondalık Format)
                  </label>
                  <input
                    type="text"
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    required
                    placeholder="Örn: 0.2000"
                    pattern="^0\.\d{1,4}$|^1\.0{1,4}$"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Ondalık sayı olarak girin:
                  </p>
                  <ul className="text-xs text-gray-500 mt-1 list-disc list-inside space-y-0.5">
                    <li>%20 için: 0.20 veya 0.2000</li>
                    <li>%18 için: 0.18 veya 0.1800</li>
                    <li>%8 için: 0.08 veya 0.0800</li>
                  </ul>
                  {vatRate && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-900">
                        Önizleme: <span className="font-bold">{formatVatRateDisplay(vatRate)}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Kaydet
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
