'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Download, X } from 'lucide-react';

interface CsvRow {
  brand: string;
  collection: string;
  stoneCode: string;
  stoneName: string;
  colorCode: string;
  colorName: string;
  m2Price: string;
  wastePercent: string;
  textureUrl: string;
}

interface ImportError {
  row: number;    // File line number per ADR-028 (includes header, so data row 1 = row 2)
  field: string;  // CSV column name
  reason: string; // Turkish error message
}

interface ImportResult {
  success: boolean;
  imported?: number;
  errors?: ImportError[];
  message?: string;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      alert('Lütfen geçerli bir CSV dosyası seçin');
      return;
    }
    setFile(selectedFile);
    setResult(null);
    parsePreview(selectedFile);
  };

  const parsePreview = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      setPreview([]);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const previewRows: CsvRow[] = [];
    
    for (let i = 1; i < Math.min(6, lines.length); i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      previewRows.push(row);
    }
    
    setPreview(previewRows);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dryRun', String(dryRun));

    try {
      const response = await fetch('/api/admin/import/stones', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.status === 403) {
        setResult({
          success: false,
          message: 'Yetki hatası: Bu işlem için yetkiniz bulunmamaktadır',
          errors: []
        });
      } else if (!response.ok) {
        setResult({
          success: false,
          message: data.message || 'Yükleme başarısız oldu',
          errors: data.errors || []
        });
      } else {
        setResult({
          success: true,
          imported: data.imported || 0,
          errors: data.errors || []
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Bağlantı hatası: Sunucuya ulaşılamadı',
        errors: []
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = 'brand,collection,stoneCode,stoneName,colorCode,colorName,m2Price,wastePercent,textureUrl';
    const example = 'Marka A,Koleksiyon 1,ST001,Beyaz Mermer,C001,Bembeyaz,450.50,15,https://example.com/texture1.jpg';
    const csv = `${headers}\n${example}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'katalog-sablonu.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearFile = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Upload className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">Veri İçe Aktarma</h1>
        </div>
        <p className="text-gray-600">
          CSV formatında taş kataloğu yükleme
        </p>
      </div>

      <div className="space-y-6">
        {/* Template Download */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">CSV Şablonu</h3>
              <p className="text-sm text-blue-800">
                Örnek CSV şablonunu indirip doldurun. Gerekli kolonlar: brand, collection, 
                stoneCode, stoneName, colorCode, colorName, m2Price, wastePercent, textureUrl
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Şablon İndir</span>
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Dosya Yükle</h2>
          
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragOver 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                CSV dosyasını sürükleyip bırakın
              </p>
              <p className="text-sm text-gray-600 mb-4">veya</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Dosya Seç
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  id="dryRun"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="dryRun" className="flex-1 cursor-pointer">
                  <span className="font-medium text-gray-900">Sadece Doğrula</span>
                  <p className="text-sm text-gray-600">
                    Veritabanına kaydetmeden önce hataları kontrol edin
                  </p>
                </label>
              </div>

              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {loading ? 'Yükleniyor...' : dryRun ? 'Doğrula' : 'Yükle'}
              </button>
            </div>
          )}
        </div>

        {/* Preview Table */}
        {preview.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Önizleme (İlk {preview.length} satır)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Marka</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Koleksiyon</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Taş Kodu</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Taş Adı</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Renk Kodu</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Renk Adı</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">m² Fiyat</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Fire %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {preview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{row.brand}</td>
                      <td className="px-4 py-3 text-gray-700">{row.collection}</td>
                      <td className="px-4 py-3 text-gray-700">{row.stoneCode}</td>
                      <td className="px-4 py-3 text-gray-700">{row.stoneName}</td>
                      <td className="px-4 py-3 text-gray-700">{row.colorCode}</td>
                      <td className="px-4 py-3 text-gray-700">{row.colorName}</td>
                      <td className="px-4 py-3 text-gray-700">{row.m2Price}</td>
                      <td className="px-4 py-3 text-gray-700">{row.wastePercent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={`border rounded-lg p-6 ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3 mb-4">
              {result.success ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? 'İşlem Başarılı' : 'İşlem Başarısız'}
                </h3>
                
                {result.success && result.imported !== undefined && (
                  <p className="text-green-800 mb-2">
                    {result.imported} satır {dryRun ? 'doğrulandı' : 'yüklendi'}
                    {result.errors && result.errors.length > 0 && 
                      `, ${result.errors.length} hata`
                    }
                  </p>
                )}

                {result.message && (
                  <p className={result.success ? 'text-green-800' : 'text-red-800'}>
                    {result.message}
                  </p>
                )}
              </div>
            </div>

            {/* Error List - ADR-028: Row numbers are file line numbers (header = line 1) */}
            {result.errors && result.errors.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold text-gray-900 mb-3">Hatalar:</h4>
                <div className="bg-white rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Satır</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Alan</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Açıklama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.errors.map((error, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-700 font-medium">#{error.row}</td>
                          <td className="px-4 py-3 text-gray-700">
                            <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {error.field}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{error.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
