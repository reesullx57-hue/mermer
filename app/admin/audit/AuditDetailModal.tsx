'use client';

import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AuditLog {
  id: string;
  createdAt: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  before?: any;
  after?: any;
  importJobStatus?: string;
  importJobTotalRows?: number;
  importJobSuccessRows?: number;
  importJobErrorRows?: number;
}

interface Props {
  log: AuditLog;
  onClose: () => void;
}

export default function AuditDetailModal({ log, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const formatJSON = (obj: any) => {
    if (!obj) return null;
    return JSON.stringify(obj, null, 2);
  };

  const getChangedFields = () => {
    if (!log.before || !log.after) return [];

    const before = log.before;
    const after = log.after;
    const changed: string[] = [];

    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    allKeys.forEach((key) => {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changed.push(key);
      }
    });

    return changed;
  };

  const highlightDiffs = (text: string, changedFields: string[]) => {
    if (!text || changedFields.length === 0) return text;

    let highlighted = text;
    changedFields.forEach((field) => {
      const regex = new RegExp(`("${field}"[^,\\n}]*[,\\n}])`, 'g');
      highlighted = highlighted.replace(regex, '⟫$1⟪');
    });

    return highlighted;
  };

  const changedFields = getChangedFields();
  const beforeJSON = formatJSON(log.before);
  const afterJSON = formatJSON(log.after);

  const highlightedBefore = beforeJSON ? highlightDiffs(beforeJSON, changedFields) : null;
  const highlightedAfter = afterJSON ? highlightDiffs(afterJSON, changedFields) : null;

  const renderHighlightedJSON = (text: string | null) => {
    if (!text) return null;

    const parts = text.split(/(⟫[^⟪]*⟪)/g);
    return parts.map((part, i) => {
      if (part.startsWith('⟫') && part.endsWith('⟪')) {
        const content = part.slice(1, -1);
        return (
          <span key={i} className="bg-yellow-200">
            {content}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Denetim Kaydı Detayı</h2>
            <p className="text-sm text-gray-500 mt-1">ID: {log.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Tarih</label>
              <p className="text-gray-900 font-medium">
                {new Date(log.createdAt).toLocaleString('tr-TR')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Kullanıcı</label>
              <p className="text-gray-900 font-medium">{log.userEmail}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">İşlem</label>
              <p className="text-gray-900 font-medium">{log.action}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Varlık Tipi</label>
              <p className="text-gray-900 font-medium">{log.entityType}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">Varlık ID</label>
              <p className="text-gray-900 font-medium font-mono break-all">{log.entityId}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-500">Özet</label>
              <p className="text-gray-900">{log.summary}</p>
            </div>
          </div>

          {log.action === 'IMPORT' && log.importJobTotalRows !== undefined && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">İçe Aktarma Detayları</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-purple-700 font-medium">Toplam:</span>{' '}
                  <span className="text-purple-900">{log.importJobTotalRows}</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Başarılı:</span>{' '}
                  <span className="text-green-900">{log.importJobSuccessRows}</span>
                </div>
                <div>
                  <span className="text-red-700 font-medium">Hata:</span>{' '}
                  <span className="text-red-900">{log.importJobErrorRows}</span>
                </div>
              </div>
              {log.importJobStatus && (
                <div className="mt-2 text-sm">
                  <span className="text-purple-700 font-medium">Durum:</span>{' '}
                  <span className="text-purple-900">{log.importJobStatus}</span>
                </div>
              )}
            </div>
          )}

          {changedFields.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Değişen alanlar:</strong> {changedFields.join(', ')}
              </p>
            </div>
          )}

          {log.action === 'CREATE' && afterJSON && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Oluşturulan Veri</h3>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                  {afterJSON}
                </pre>
              </div>
            </div>
          )}

          {log.action === 'DELETE' && beforeJSON && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Silinen Veri</h3>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                  {beforeJSON}
                </pre>
              </div>
            </div>
          )}

          {log.action === 'UPDATE' && beforeJSON && afterJSON && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Önceki</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                    {renderHighlightedJSON(highlightedBefore)}
                  </pre>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sonraki</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                    {renderHighlightedJSON(highlightedAfter)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {log.action === 'IMPORT' && afterJSON && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                İçe Aktarma Yapılandırması
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800 font-mono whitespace-pre-wrap">
                  {afterJSON}
                </pre>
              </div>
            </div>
          )}

          {!beforeJSON && !afterJSON && (
            <div className="text-center py-8 text-gray-500">
              Bu kayıt için detaylı veri bulunmuyor
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
