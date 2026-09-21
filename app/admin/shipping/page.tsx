'use client';

import { useEffect, useState } from 'react';
import { Truck, Plus, Edit2, Loader2, AlertCircle } from 'lucide-react';
import type {
  ShippingZoneWithAudit,
  CreateShippingZoneRequest,
  UpdateShippingZoneRequest,
} from '@/lib/types/shipping';
import {
  fetchShippingZones,
  createShippingZone,
  updateShippingZone,
  ShippingApiError,
} from '@/lib/api/shipping';
import { showToast, ToastContainer } from '@/components/Toast';

type FormMode = 'create' | 'edit' | null;

interface FormData {
  city: string;
  district: string;
  fee: string;
  installAvailable: boolean;
  isActive: boolean;
}

export default function ShippingPage() {
  const [zones, setZones] = useState<ShippingZoneWithAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedZone, setSelectedZone] = useState<ShippingZoneWithAudit | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    city: '',
    district: '',
    fee: '',
    installAvailable: false,
    isActive: true,
  });

  useEffect(() => {
    loadZones();
  }, []);

  async function loadZones() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchShippingZones();
      setZones(data);
    } catch (err) {
      if (err instanceof ShippingApiError) {
        if (err.code === 'FORBIDDEN') {
          setError('Erişim reddedildi. Admin yetkisi gerekli.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Nakliye bölgeleri yüklenirken bir hata oluştu.');
      }
      console.error('Failed to load shipping zones:', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setFormMode('create');
    setSelectedZone(null);
    setFormData({
      city: '',
      district: '',
      fee: '',
      installAvailable: false,
      isActive: true,
    });
  }

  function openEditForm(zone: ShippingZoneWithAudit) {
    setFormMode('edit');
    setSelectedZone(zone);
    setFormData({
      city: zone.city,
      district: zone.district,
      fee: zone.fee,
      installAvailable: zone.installAvailable,
      isActive: zone.isActive,
    });
  }

  function closeForm() {
    setFormMode(null);
    setSelectedZone(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (formMode === 'create') {
        const request: CreateShippingZoneRequest = {
          city: formData.city,
          district: formData.district,
          fee: formData.fee,
          installAvailable: formData.installAvailable,
          isActive: formData.isActive,
        };
        await createShippingZone(request);
        showToast('Nakliye bölgesi başarıyla oluşturuldu.', 'success');
      } else if (formMode === 'edit' && selectedZone) {
        const request: UpdateShippingZoneRequest = {
          fee: formData.fee,
          installAvailable: formData.installAvailable,
          isActive: formData.isActive,
        };
        await updateShippingZone(selectedZone.id, request);
        showToast('Nakliye bölgesi başarıyla güncellendi.', 'success');
      }
      closeForm();
      loadZones();
    } catch (err) {
      if (err instanceof ShippingApiError) {
        if (err.code === 'FORBIDDEN') {
          showToast('Erişim reddedildi. Admin yetkisi gerekli.', 'error');
        } else {
          showToast(err.message, 'error');
        }
      } else {
        showToast('İşlem sırasında bir hata oluştu.', 'error');
      }
      console.error('Form submission error:', err);
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <div>
      <ToastContainer />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Nakliye Ayarları</h1>
          </div>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Bölge
          </button>
        </div>
        <p className="text-gray-600">
          Nakliye bölgeleri ve ücretleri yönetimi
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

      {!loading && !error && zones.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Henüz nakliye bölgesi yok
          </h3>
          <p className="text-gray-600 mb-4">
            Yeni bir nakliye bölgesi oluşturarak başlayın.
          </p>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Bölge Oluştur
          </button>
        </div>
      )}

      {!loading && !error && zones.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İl
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İlçe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ücret (₺)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montaj
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Son Güncelleyen
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {zones.map((zone) => (
                <tr key={zone.id} className={zone.isActive ? '' : 'bg-gray-50 opacity-60'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {zone.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {zone.district || <span className="text-gray-500 italic">İl Geneli</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {zone.fee}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {zone.installAvailable ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Mevcut
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Yok
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {zone.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Pasif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {zone.lastUpdater ? (
                      <>
                        <div>{new Date(zone.lastUpdater.timestamp).toLocaleDateString('tr-TR')}</div>
                        <div className="text-xs text-gray-500">{zone.lastUpdater.email}</div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-400 italic">Henüz güncellenmedi</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditForm(zone)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {formMode === 'create' ? 'Yeni Nakliye Bölgesi' : 'Nakliye Bölgesi Düzenle'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İl
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  disabled={formMode === 'edit'}
                  placeholder="Örn: İstanbul"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                />
                {formMode === 'edit' && (
                  <p className="text-xs text-gray-500 mt-1">
                    İl değiştirilemez
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İlçe
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  disabled={formMode === 'edit'}
                  placeholder="Boş bırakılırsa: İl Geneli"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formMode === 'edit' 
                    ? 'İlçe değiştirilemez' 
                    : 'Boş bırakılırsa il geneli olarak kaydedilir'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nakliye Ücreti (₺)
                </label>
                <input
                  type="text"
                  value={formData.fee}
                  onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                  required
                  placeholder="Örn: 150.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ondalık sayı olarak girin (örn: 150.00)
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="installAvailable"
                  checked={formData.installAvailable}
                  onChange={(e) => setFormData({ ...formData, installAvailable: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="installAvailable" className="ml-2 text-sm text-gray-700">
                  Montaj hizmeti mevcut
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Aktif
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : formMode === 'create' ? (
                    'Oluştur'
                  ) : (
                    'Güncelle'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
