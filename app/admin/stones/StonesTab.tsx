'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, Check, X, Image as ImageIcon } from 'lucide-react';
import type {
  StoneCollectionWithAudit,
  StoneWithAudit,
  CreateStoneRequest,
  UpdateStoneRequest,
} from '@/lib/types/stone';
import {
  fetchStoneCollections,
  fetchStones,
  createStone,
  updateStone,
  deleteStone,
  StonesApiError,
} from '@/lib/api/stones';
import { showToast } from '@/components/Toast';

type FormMode = 'create' | 'edit' | null;

interface FormData {
  collectionId: string;
  name: string;
  textureUrl: string;
  isActive: boolean;
}

export default function StonesTab() {
  const [stones, setStones] = useState<StoneWithAudit[]>([]);
  const [collections, setCollections] = useState<StoneCollectionWithAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedStone, setSelectedStone] = useState<StoneWithAudit | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    collectionId: '',
    name: '',
    textureUrl: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [stonesData, collectionsData] = await Promise.all([
        fetchStones(),
        fetchStoneCollections(),
      ]);
      setStones(stonesData);
      setCollections(collectionsData);
    } catch (err) {
      if (err instanceof StonesApiError) {
        if (err.code === 'FORBIDDEN') {
          setError('Erişim reddedildi. Admin yetkisi gerekli.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Taşlar yüklenirken bir hata oluştu.');
      }
      console.error('Failed to load stones:', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setFormMode('create');
    setSelectedStone(null);
    setFormData({
      collectionId: collections.length > 0 ? collections[0].id : '',
      name: '',
      textureUrl: '',
      isActive: true,
    });
  }

  function openEditForm(stone: StoneWithAudit) {
    setFormMode('edit');
    setSelectedStone(stone);
    setFormData({
      collectionId: stone.collectionId,
      name: stone.name,
      textureUrl: stone.textureUrl || '',
      isActive: stone.isActive,
    });
  }

  function closeForm() {
    setFormMode(null);
    setSelectedStone(null);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const localPath = `/local/textures/${file.name}`;
      setFormData({ ...formData, textureUrl: localPath });
      showToast(`Dosya seçildi: ${file.name} (F2 stub - yerel yol)`, 'success');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (formMode === 'create') {
        const request: CreateStoneRequest = {
          collectionId: formData.collectionId,
          name: formData.name,
          textureUrl: formData.textureUrl || null,
          isActive: formData.isActive,
        };
        await createStone(request);
        showToast('Taş başarıyla oluşturuldu.', 'success');
      } else if (formMode === 'edit' && selectedStone) {
        const request: UpdateStoneRequest = {
          collectionId: formData.collectionId,
          name: formData.name,
          textureUrl: formData.textureUrl || null,
          isActive: formData.isActive,
        };
        await updateStone(selectedStone.id, request);
        showToast('Taş başarıyla güncellendi.', 'success');
      }
      closeForm();
      loadData();
    } catch (err) {
      if (err instanceof StonesApiError) {
        if (err.code === 'FORBIDDEN') {
          showToast('Erişim reddedildi. Admin yetkisi gerekli.', 'error');
        } else {
          showToast(err.message, 'error');
        }
      } else {
        showToast('İşlem gerçekleştirilemedi.', 'error');
      }
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(stone: StoneWithAudit) {
    if (!confirm(`"${stone.name}" taşını silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await deleteStone(stone.id);
      showToast('Taş başarıyla silindi.', 'success');
      loadData();
    } catch (err) {
      if (err instanceof StonesApiError) {
        if (err.code === 'FORBIDDEN') {
          showToast('Erişim reddedildi. Admin yetkisi gerekli.', 'error');
        } else {
          showToast(err.message, 'error');
        }
      } else {
        showToast('Silme işlemi başarısız oldu.', 'error');
      }
      console.error('Delete failed:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Hata</h3>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Taşlar</h2>
        <button
          onClick={openCreateForm}
          disabled={collections.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={collections.length === 0 ? 'Önce koleksiyon eklemelisiniz' : ''}
        >
          <Plus className="w-5 h-5" />
          Yeni Taş
        </button>
      </div>

      {/* Stones List */}
      {stones.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            {collections.length === 0
              ? 'Taş eklemek için önce koleksiyon eklemelisiniz.'
              : 'Henüz taş eklenmemiş.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taş Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Koleksiyon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marka
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doku
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
              {stones.map((stone) => (
                <tr key={stone.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{stone.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{stone.collectionName || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{stone.brandName || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {stone.textureUrl ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-xs truncate max-w-[100px]" title={stone.textureUrl}>
                          {stone.textureUrl}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {stone.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="w-3 h-3" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <X className="w-3 h-3" />
                        Pasif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {stone.lastUpdater ? (
                      <div className="text-sm text-gray-600">
                        <div>{stone.lastUpdater.email}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(stone.lastUpdater.timestamp).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditForm(stone)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(stone)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {formMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {formMode === 'create' ? 'Yeni Taş Ekle' : 'Taşı Düzenle'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Koleksiyon
                </label>
                <select
                  value={formData.collectionId}
                  onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Koleksiyon seçin</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.brandName} - {collection.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taş Adı
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doku Görseli (ADR-019 Stub)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    onChange={handleFileInput}
                    accept="image/*"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {formData.textureUrl && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-700">
                      <ImageIcon className="w-4 h-4" />
                      <span className="truncate">{formData.textureUrl}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    F2 stub: Dosya yerel yol olarak kaydedilir. Gerçek yükleme daha sonra eklenecek.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Aktif
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    'Kaydet'
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
