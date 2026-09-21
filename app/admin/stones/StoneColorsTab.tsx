'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, Check, X, Image as ImageIcon } from 'lucide-react';
import type {
  StoneColor,
  CreateStoneColorRequest,
  UpdateStoneColorRequest,
} from '@/lib/types/stone';
import {
  fetchStoneColors,
  createStoneColor,
  updateStoneColor,
  deleteStoneColor,
  StonesApiError,
} from '@/lib/api/stones';
import { showToast } from '@/components/Toast';

type FormMode = 'create' | 'edit' | null;

interface FormData {
  stoneId: string;
  code: string;
  nameTr: string;
  m2Price: string;
  wastePercent: string;
  textureUrl: string;
  isActive: boolean;
}

export default function StoneColorsTab() {
  const [colors, setColors] = useState<StoneColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedColor, setSelectedColor] = useState<StoneColor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    stoneId: '',
    code: '',
    nameTr: '',
    m2Price: '',
    wastePercent: '',
    textureUrl: '',
    isActive: true,
  });

  useEffect(() => {
    loadColors();
  }, []);

  async function loadColors() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStoneColors(undefined, true); // All stones, include inactive
      setColors(data);
    } catch (err) {
      if (err instanceof StonesApiError) {
        if (err.code === 'FORBIDDEN') {
          setError('Erişim reddedildi. Admin yetkisi gerekli.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Renkler yüklenirken bir hata oluştu.');
      }
      console.error('Failed to load colors:', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setFormMode('create');
    setSelectedColor(null);
    setFormData({
      stoneId: '',
      code: '',
      nameTr: '',
      m2Price: '',
      wastePercent: '',
      textureUrl: '',
      isActive: true,
    });
  }

  function openEditForm(color: StoneColor) {
    setFormMode('edit');
    setSelectedColor(color);
    // Convert wastePercent from 0-1 range to percentage for display
    const wastePercentDisplay = color.wastePercent 
      ? (parseFloat(color.wastePercent) * 100).toString()
      : '';
    setFormData({
      stoneId: color.stoneId,
      code: color.code,
      nameTr: color.nameTr,
      m2Price: color.m2Price,
      wastePercent: wastePercentDisplay,
      textureUrl: color.textureUrl || '',
      isActive: color.isActive,
    });
  }

  function closeForm() {
    setFormMode(null);
    setSelectedColor(null);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const localPath = `/local/textures/${file.name}`;
      setFormData({ ...formData, textureUrl: localPath });
      showToast(`Dosya seçildi: ${file.name} (ADR-019 stub - yerel yol)`, 'success');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Convert wastePercent from percentage (0-100) to decimal (0-1) for PE API
      const wastePercentValue = formData.wastePercent.trim() === '' 
        ? null 
        : parseFloat(formData.wastePercent) / 100;

      if (formMode === 'create') {
        const request: CreateStoneColorRequest = {
          stoneId: formData.stoneId,
          code: formData.code,
          nameTr: formData.nameTr,
          m2Price: parseFloat(formData.m2Price),
          wastePercent: wastePercentValue,
          textureUrl: formData.textureUrl || null,
          isActive: formData.isActive,
        };
        await createStoneColor(request);
        showToast('Renk başarıyla oluşturuldu.', 'success');
      } else if (formMode === 'edit' && selectedColor) {
        const request: UpdateStoneColorRequest = {
          code: formData.code,
          nameTr: formData.nameTr,
          m2Price: parseFloat(formData.m2Price),
          wastePercent: wastePercentValue,
          textureUrl: formData.textureUrl || null,
          isActive: formData.isActive,
        };
        await updateStoneColor(selectedColor.id, request);
        showToast('Renk başarıyla güncellendi.', 'success');
      }
      closeForm();
      loadColors();
    } catch (err) {
      if (err instanceof StonesApiError) {
        if (err.code === 'FORBIDDEN') {
          showToast('Erişim reddedildi. Admin yetkisi gerekli.', 'error');
        } else if (err.code === 'STONE_NOT_FOUND') {
          showToast('Taş bulunamadı.', 'error');
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

  async function handleDelete(color: StoneColor) {
    if (!confirm(`"${color.nameTr}" rengini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await deleteStoneColor(color.id);
      showToast('Renk başarıyla silindi.', 'success');
      loadColors();
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
        <h2 className="text-xl font-semibold text-gray-900">Taş Renkleri</h2>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Renk
        </button>
      </div>

      {/* Colors List */}
      {colors.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">Henüz renk eklenmemiş.</p>
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
                  Renk Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taş / Marka
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  m² Fiyat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fire %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doku
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {colors.map((color) => (
                <tr key={color.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">{color.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{color.nameTr}</div>
                  </td>
                  <td className="px-6 py-4">
                    {color.stone ? (
                      <div className="text-sm text-gray-600">
                        <div className="font-medium">{color.stone.nameTr}</div>
                        <div className="text-xs text-gray-500">{color.stone.brand.nameTr}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {color.m2Price} TRY
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {color.wastePercent 
                        ? `${(parseFloat(color.wastePercent) * 100).toFixed(2)}%` 
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {color.textureUrl ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-xs truncate max-w-[80px]" title={color.textureUrl}>
                          {color.textureUrl.split('/').pop()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {color.isActive ? (
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
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditForm(color)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(color)}
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
                {formMode === 'create' ? 'Yeni Renk Ekle' : 'Rengi Düzenle'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taş ID
                </label>
                <input
                  type="text"
                  value={formData.stoneId}
                  onChange={(e) => setFormData({ ...formData, stoneId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  required
                  placeholder="cuid"
                />
                <p className="text-xs text-gray-500 mt-1">
                  PE stone ID (CUID format)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renk Kodu
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  required
                  placeholder="WHITE_01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renk Adı (Türkçe)
                </label>
                <input
                  type="text"
                  value={formData.nameTr}
                  onChange={(e) => setFormData({ ...formData, nameTr: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  placeholder="Kar Beyazı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  m² Fiyat (TRY)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.m2Price}
                  onChange={(e) => setFormData({ ...formData, m2Price: e.target.value })}
                  placeholder="450.50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fire Yüzdesi (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.wastePercent}
                  onChange={(e) => setFormData({ ...formData, wastePercent: e.target.value })}
                  placeholder="15.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  İsteğe bağlı - boş bırakılabilir. PE API'ye 0-1 range olarak gönderilir.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doku Görseli URL (ADR-019)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.textureUrl}
                    onChange={(e) => setFormData({ ...formData, textureUrl: e.target.value })}
                    placeholder="public/uploads/textures/550e8400-e29b-41d4-a716-446655440000.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Veya dosya yükleyin:
                  </p>
                  <input
                    type="file"
                    onChange={handleFileInput}
                    accept="image/*"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
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
