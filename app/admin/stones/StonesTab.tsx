'use client';

import { useEffect, useState } from 'react';
import { Plus, Loader2, AlertCircle, Check, X } from 'lucide-react';
import type {
  StoneBrand,
  StoneCollection,
  Stone,
  CreateStoneRequest,
} from '@/lib/types/stone';
import {
  fetchStoneBrands,
  fetchStoneCollections,
  fetchStones,
  createStone,
  StonesApiError,
} from '@/lib/api/stones';
import { showToast } from '@/components/Toast';

type FormMode = 'create' | null;

interface FormData {
  brandId: string;
  collectionId: string;
  code: string;
  nameTr: string;
  isActive: boolean;
}

export default function StonesTab() {
  const [stones, setStones] = useState<Stone[]>([]);
  const [brands, setBrands] = useState<StoneBrand[]>([]);
  const [collections, setCollections] = useState<StoneCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    brandId: '',
    collectionId: '',
    code: '',
    nameTr: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [stonesData, brandsData, collectionsData] = await Promise.all([
        fetchStones(undefined, undefined, true),
        fetchStoneBrands(true),
        fetchStoneCollections(undefined, true),
      ]);
      setStones(stonesData);
      setBrands(brandsData);
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
    setFormData({
      brandId: brands.length > 0 ? brands[0].id : '',
      collectionId: '',
      code: '',
      nameTr: '',
      isActive: true,
    });
  }

  function closeForm() {
    setFormMode(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const request: CreateStoneRequest = {
        brandId: formData.brandId,
        collectionId: formData.collectionId || null,
        code: formData.code,
        nameTr: formData.nameTr,
        isActive: formData.isActive,
      };
      await createStone(request);
      showToast('Taş başarıyla oluşturuldu.', 'success');
      closeForm();
      loadData();
    } catch (err) {
      if (err instanceof StonesApiError) {
        if (err.code === 'FORBIDDEN') {
          showToast('Erişim reddedildi. Admin yetkisi gerekli.', 'error');
        } else if (err.code === 'BRAND_NOT_FOUND') {
          showToast('Marka bulunamadı.', 'error');
        } else if (err.code === 'COLLECTION_NOT_FOUND') {
          showToast('Koleksiyon bulunamadı.', 'error');
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

  // Filter collections by selected brand
  const filteredCollections = formData.brandId
    ? collections.filter((c) => c.brandId === formData.brandId)
    : collections;

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
          disabled={brands.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          title={brands.length === 0 ? 'Önce marka eklemelisiniz' : ''}
        >
          <Plus className="w-5 h-5" />
          Yeni Taş
        </button>
      </div>

      {/* Stones List */}
      {stones.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">
            {brands.length === 0
              ? 'Taş eklemek için önce marka eklemelisiniz.'
              : 'Henüz taş eklenmemiş.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kod
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taş Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marka
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Koleksiyon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İstatistikler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stones.map((stone) => (
                <tr key={stone.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">{stone.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{stone.nameTr}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {stone.brand?.nameTr || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {stone.collection?.nameTr || '-'}
                    </div>
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
                    {stone._count ? (
                      <div className="text-sm text-gray-600">
                        {stone._count.colors} renk
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Yeni Taş Ekle
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marka
                </label>
                <select
                  value={formData.brandId}
                  onChange={(e) => setFormData({ ...formData, brandId: e.target.value, collectionId: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Marka seçin</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.nameTr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Koleksiyon (opsiyonel)
                </label>
                <select
                  value={formData.collectionId}
                  onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={!formData.brandId}
                >
                  <option value="">Koleksiyon seçin (opsiyonel)</option>
                  {filteredCollections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.nameTr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taş Kodu
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  required
                  placeholder="MARBLE_WHITE_01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taş Adı (Türkçe)
                </label>
                <input
                  type="text"
                  value={formData.nameTr}
                  onChange={(e) => setFormData({ ...formData, nameTr: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  placeholder="Beyaz Mermer"
                />
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
