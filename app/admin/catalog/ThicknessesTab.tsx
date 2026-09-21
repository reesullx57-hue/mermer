'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import type {
  ThicknessWithAudit,
  CreateThicknessRequest,
  UpdateCatalogItemRequest,
} from '@/lib/types/catalog';
import {
  fetchThicknesses,
  createThickness,
  updateThickness,
  deactivateThickness,
  CatalogApiError,
} from '@/lib/api/catalog';
import { showToast } from '@/components/Toast';

type FormMode = 'create' | 'edit' | null;

interface FormData {
  cm: string;
  nameTr: string;
  coefficient: string;
}

export default function ThicknessesTab() {
  const [items, setItems] = useState<ThicknessWithAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedItem, setSelectedItem] = useState<ThicknessWithAudit | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    cm: '',
    nameTr: '',
    coefficient: '1.00',
  });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchThicknesses();
      setItems(data);
    } catch (err) {
      if (err instanceof CatalogApiError) {
        if (err.code === 'FORBIDDEN') {
          setError('Erişim reddedildi. Admin yetkisi gerekli.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Kalınlıklar yüklenirken bir hata oluştu.');
      }
      console.error('Failed to load thicknesses:', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setFormMode('create');
    setSelectedItem(null);
    setFormData({
      cm: '',
      nameTr: '',
      coefficient: '1.00',
    });
  }

  function openEditForm(item: ThicknessWithAudit) {
    setFormMode('edit');
    setSelectedItem(item);
    setFormData({
      cm: String(item.cm),
      nameTr: item.nameTr,
      coefficient: item.coefficient,
    });
  }

  function closeForm() {
    setFormMode(null);
    setSelectedItem(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (formMode === 'create') {
        const request: CreateThicknessRequest = {
          cm: parseInt(formData.cm),
          nameTr: formData.nameTr,
          coefficient: formData.coefficient,
        };
        await createThickness(request);
        showToast('Kalınlık başarıyla oluşturuldu.', 'success');
      } else if (formMode === 'edit' && selectedItem) {
        const request: UpdateCatalogItemRequest = {
          nameTr: formData.nameTr,
          coefficient: formData.coefficient,
        };
        await updateThickness(selectedItem.id, request);
        showToast('Kalınlık başarıyla güncellendi.', 'success');
      }
      closeForm();
      loadItems();
    } catch (err) {
      if (err instanceof CatalogApiError) {
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

  async function handleDeactivate(item: ThicknessWithAudit) {
    if (!confirm(`"${item.nameTr}" kalınlığını devre dışı bırakmak istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await deactivateThickness(item.id);
      showToast('Kalınlık devre dışı bırakıldı.', 'success');
      loadItems();
    } catch (err) {
      if (err instanceof CatalogApiError) {
        if (err.code === 'FORBIDDEN') {
          showToast('Erişim reddedildi. Admin yetkisi gerekli.', 'error');
        } else {
          showToast(err.message, 'error');
        }
      } else {
        showToast('İşlem sırasında bir hata oluştu.', 'error');
      }
      console.error('Deactivation error:', err);
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">
          Taş kalınlığı opsiyonları ve fiyatlandırma katsayıları
        </p>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Kalınlık
        </button>
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

      {!loading && !error && items.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Henüz kalınlık yok
          </h3>
          <p className="text-gray-600 mb-4">
            Yeni bir kalınlık oluşturarak başlayın.
          </p>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Kalınlık Oluştur
          </button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kalınlık (cm)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Türkçe Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Katsayı
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
              {items.map((item) => (
                <tr key={item.id} className={item.isActive ? '' : 'bg-gray-50 opacity-60'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.cm} cm</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.nameTr}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {item.coefficient}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.lastUpdater ? (
                      <>
                        <div>{new Date(item.lastUpdater.timestamp).toLocaleDateString('tr-TR')}</div>
                        <div className="text-xs text-gray-500">{item.lastUpdater.email}</div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-400 italic">Henüz güncellenmedi</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditForm(item)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                      title="Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {item.isActive && (
                      <button
                        onClick={() => handleDeactivate(item)}
                        className="text-red-600 hover:text-red-800"
                        title="Devre Dışı Bırak"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
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
                {formMode === 'create' ? 'Yeni Kalınlık' : 'Kalınlık Düzenle'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kalınlık (cm)
                </label>
                <input
                  type="number"
                  value={formData.cm}
                  onChange={(e) => setFormData({ ...formData, cm: e.target.value })}
                  disabled={formMode === 'edit'}
                  required
                  min="1"
                  step="1"
                  placeholder="Örn: 2, 3, 4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Türkçe Adı
                </label>
                <input
                  type="text"
                  value={formData.nameTr}
                  onChange={(e) => setFormData({ ...formData, nameTr: e.target.value })}
                  required
                  placeholder="Örn: 2 cm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Katsayı
                </label>
                <input
                  type="text"
                  value={formData.coefficient}
                  onChange={(e) => setFormData({ ...formData, coefficient: e.target.value })}
                  required
                  placeholder="Örn: 1.00, 1.10, 1.20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ondalık sayı olarak girin (örn: 1.00, 1.10, 1.20)
                </p>
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
