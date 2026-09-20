'use client';

import { useEffect, useState } from 'react';
import { Tag, Plus, Edit2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import type {
  PriceRule,
  PriceRuleCode,
  CreatePriceRuleRequest,
  UpdatePriceRuleRequest,
} from '@/lib/types/pricerule';
import {
  fetchPriceRules,
  createPriceRule,
  updatePriceRule,
  deactivatePriceRule,
  PriceRulesApiError,
} from '@/lib/api/pricerules';
import { showToast, ToastContainer } from '@/components/Toast';

const PRICE_RULE_CODES: PriceRuleCode[] = [
  'SINK_HOLE',
  'COOKTOP_HOLE',
  'INSTALL',
  'WASTE_DEFAULT_PERCENT',
  'MIN_AREA_M2',
  'MIN_ORDER_AMOUNT',
];

const PRICE_RULE_LABELS: Record<PriceRuleCode, string> = {
  SINK_HOLE: 'Lavabo Deliği',
  COOKTOP_HOLE: 'Ocak Deliği',
  INSTALL: 'Montaj',
  WASTE_DEFAULT_PERCENT: 'Varsayılan Fire Yüzdesi',
  MIN_AREA_M2: 'Minimum Alan (m²)',
  MIN_ORDER_AMOUNT: 'Minimum Sipariş Tutarı',
};

type FormMode = 'create' | 'edit' | null;

interface FormData {
  code: PriceRuleCode;
  validFrom: string;
  validTo: string;
  value: string;
}

export default function PriceRulesPage() {
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedRule, setSelectedRule] = useState<PriceRule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    code: 'SINK_HOLE',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
    value: '',
  });

  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPriceRules();
      setRules(data);
    } catch (err) {
      if (err instanceof PriceRulesApiError) {
        if (err.code === 'FORBIDDEN') {
          setError('Erişim reddedildi. Admin yetkisi gerekli.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Fiyat kuralları yüklenirken bir hata oluştu.');
      }
      console.error('Failed to load price rules:', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setFormMode('create');
    setSelectedRule(null);
    setFormData({
      code: 'SINK_HOLE',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      value: '',
    });
  }

  function openEditForm(rule: PriceRule) {
    setFormMode('edit');
    setSelectedRule(rule);
    setFormData({
      code: rule.code,
      validFrom: rule.validFrom.split('T')[0],
      validTo: rule.validTo ? rule.validTo.split('T')[0] : '',
      value: rule.value,
    });
  }

  function closeForm() {
    setFormMode(null);
    setSelectedRule(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (formMode === 'create') {
        const request: CreatePriceRuleRequest = {
          code: formData.code,
          validFrom: new Date(formData.validFrom).toISOString(),
          validTo: formData.validTo
            ? new Date(formData.validTo).toISOString()
            : null,
          value: formData.value,
        };
        await createPriceRule(request);
        showToast('Fiyat kuralı başarıyla oluşturuldu.', 'success');
      } else if (formMode === 'edit' && selectedRule) {
        const request: UpdatePriceRuleRequest = {
          validFrom: new Date(formData.validFrom).toISOString(),
          validTo: formData.validTo
            ? new Date(formData.validTo).toISOString()
            : null,
          value: formData.value,
        };
        await updatePriceRule(selectedRule.id, request);
        showToast('Fiyat kuralı başarıyla güncellendi.', 'success');
      }
      closeForm();
      loadRules();
    } catch (err) {
      if (err instanceof PriceRulesApiError) {
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

  async function handleDeactivate(rule: PriceRule) {
    if (!confirm(`"${PRICE_RULE_LABELS[rule.code]}" kuralını devre dışı bırakmak istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await deactivatePriceRule(rule.id);
      showToast('Fiyat kuralı devre dışı bırakıldı.', 'success');
      loadRules();
    } catch (err) {
      if (err instanceof PriceRulesApiError) {
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
      <ToastContainer />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Tag className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Fiyat Kuralları</h1>
          </div>
          <button
            onClick={openCreateForm}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Kural
          </button>
        </div>
        <p className="text-gray-600">
          Fiyatlandırma motoru kuralları ve yapılandırma
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

      {!loading && !error && rules.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Henüz fiyat kuralı yok
          </h3>
          <p className="text-gray-600 mb-4">
            Yeni bir fiyat kuralı oluşturarak başlayın.
          </p>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Kural Oluştur
          </button>
        </div>
      )}

      {!loading && !error && rules.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kod
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Versiyon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Değer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Geçerlilik Başlangıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Geçerlilik Sonu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Güncelleme
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rules.map((rule) => {
                const isActive = rule.validTo === null || new Date(rule.validTo) > new Date();
                return (
                  <tr key={rule.id} className={isActive ? '' : 'bg-gray-50 opacity-60'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {PRICE_RULE_LABELS[rule.code]}
                      </div>
                      <div className="text-xs text-gray-500">{rule.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      v{rule.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {rule.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(rule.validFrom).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {rule.validTo
                        ? new Date(rule.validTo).toLocaleDateString('tr-TR')
                        : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>{new Date(rule.updatedAt).toLocaleDateString('tr-TR')}</div>
                      {rule.updatedBy && (
                        <div className="text-xs text-gray-500">{rule.updatedBy}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditForm(rule)}
                        className="text-blue-600 hover:text-blue-800 mr-4"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {isActive && (
                        <button
                          onClick={() => handleDeactivate(rule)}
                          className="text-red-600 hover:text-red-800"
                          title="Devre Dışı Bırak"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {formMode === 'create' ? 'Yeni Fiyat Kuralı' : 'Fiyat Kuralı Düzenle'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kural Kodu
                </label>
                <select
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value as PriceRuleCode })
                  }
                  disabled={formMode === 'edit'}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  {PRICE_RULE_CODES.map((code) => (
                    <option key={code} value={code}>
                      {PRICE_RULE_LABELS[code]} ({code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Değer
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                  placeholder="Örn: 100.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ondalık sayı olarak girin (örn: 100.00, 0.15, 2.5)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geçerlilik Başlangıcı
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geçerlilik Sonu (Opsiyonel)
                </label>
                <input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Boş bırakılırsa kural süresiz geçerli olur
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
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
