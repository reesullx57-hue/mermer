'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { QuoteFormData, QuoteResponse, FormType, EdgeType, SinkType } from '@/types/quote';
import { getQuote } from '@/lib/pricing/quote-client';
import { Loader2 } from 'lucide-react';

export default function TeklifPage() {
  const [formData, setFormData] = useState<QuoteFormData>({
    stoneColorId: '',
    thickness: 2,
    formType: 'STRAIGHT',
    edgeType: 'straight',
    dimensions: {
      length: 0,
      depth: 0,
    },
    sink: {
      type: 'none',
      holes: 0,
    },
    cooktopHole: false,
    skirting: {
      enabled: false,
    },
    trim: {
      enabled: false,
    },
    sideBox: {
      enabled: false,
    },
    panelled: false,
    install: false,
    address: {
      city: '',
      district: '',
    },
  });

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDimensions = (formType: FormType) => {
    const baseDepth = formData.dimensions.depth || 0;
    switch (formType) {
      case 'STRAIGHT':
      case 'ISLAND':
        return { length: 0, depth: baseDepth };
      case 'L':
        return { leg1: 0, leg2: 0, depth: baseDepth };
      case 'U':
        return { leg1: 0, leg2: 0, leg3: 0, depth: baseDepth };
    }
  };

  const handleFormTypeChange = (value: string) => {
    const formType = value as FormType;
    setFormData({
      ...formData,
      formType,
      dimensions: updateDimensions(formType),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await getQuote(formData);
      setQuote(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderDimensionFields = () => {
    switch (formData.formType) {
      case 'STRAIGHT':
      case 'ISLAND':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="length">Uzunluk (cm)</Label>
              <Input
                id="length"
                type="number"
                value={formData.dimensions.length || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, length: parseFloat(e.target.value) || 0 }
                })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depth">Derinlik (cm)</Label>
              <Input
                id="depth"
                type="number"
                value={formData.dimensions.depth || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, depth: parseFloat(e.target.value) || 0 }
                })}
                required
              />
            </div>
          </>
        );
      
      case 'L':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="leg1">Bacak 1 (cm)</Label>
              <Input
                id="leg1"
                type="number"
                value={formData.dimensions.leg1 || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, leg1: parseFloat(e.target.value) || 0 }
                })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leg2">Bacak 2 (cm)</Label>
              <Input
                id="leg2"
                type="number"
                value={formData.dimensions.leg2 || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, leg2: parseFloat(e.target.value) || 0 }
                })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depth">Derinlik (cm)</Label>
              <Input
                id="depth"
                type="number"
                value={formData.dimensions.depth || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, depth: parseFloat(e.target.value) || 0 }
                })}
                required
              />
            </div>
          </>
        );
      
      case 'U':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="leg1">Bacak 1 (cm)</Label>
              <Input
                id="leg1"
                type="number"
                value={formData.dimensions.leg1 || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, leg1: parseFloat(e.target.value) || 0 }
                })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leg2">Bacak 2 (cm)</Label>
              <Input
                id="leg2"
                type="number"
                value={formData.dimensions.leg2 || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, leg2: parseFloat(e.target.value) || 0 }
                })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leg3">Bacak 3 (cm)</Label>
              <Input
                id="leg3"
                type="number"
                value={formData.dimensions.leg3 || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, leg3: parseFloat(e.target.value) || 0 }
                })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depth">Derinlik (cm)</Label>
              <Input
                id="depth"
                type="number"
                value={formData.dimensions.depth || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, depth: parseFloat(e.target.value) || 0 }
                })}
                required
              />
            </div>
          </>
        );
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mermer Tezgah Teklif</h1>
          <p className="text-gray-600">Tezgah özelliklerinizi girin ve anında fiyat alın</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Teklif Formu</CardTitle>
              <CardDescription>Tezgah özelliklerini doldurun</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="stoneColorId">Taş Rengi ID</Label>
                  <Input
                    id="stoneColorId"
                    value={formData.stoneColorId}
                    onChange={(e) => setFormData({ ...formData, stoneColorId: e.target.value })}
                    placeholder="Örn: CALACATTA-GOLD"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thickness">Kalınlık (cm)</Label>
                  <Select
                    value={formData.thickness.toString()}
                    onValueChange={(value) => setFormData({ ...formData, thickness: parseInt(value) as 2 | 3 | 4 })}
                  >
                    <SelectTrigger id="thickness">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 cm</SelectItem>
                      <SelectItem value="3">3 cm</SelectItem>
                      <SelectItem value="4">4 cm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formType">Form Tipi</Label>
                  <Select value={formData.formType} onValueChange={handleFormTypeChange}>
                    <SelectTrigger id="formType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STRAIGHT">Düz</SelectItem>
                      <SelectItem value="L">L Şekli</SelectItem>
                      <SelectItem value="U">U Şekli</SelectItem>
                      <SelectItem value="ISLAND">Ada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edgeType">Kenar Tipi</Label>
                  <Select
                    value={formData.edgeType}
                    onValueChange={(value) => setFormData({ ...formData, edgeType: value as EdgeType })}
                  >
                    <SelectTrigger id="edgeType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="straight">Düz</SelectItem>
                      <SelectItem value="radius">Radius</SelectItem>
                      <SelectItem value="bevel">Bevel</SelectItem>
                      <SelectItem value="iron">Ütü</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderDimensionFields()}
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-lg">Ekstra Özellikler</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sinkType">Eviye Tipi</Label>
                    <Select
                      value={formData.sink.type}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        sink: { ...formData.sink, type: value as SinkType }
                      })}
                    >
                      <SelectTrigger id="sinkType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Yok</SelectItem>
                        <SelectItem value="undermount">Tezgah Altı</SelectItem>
                        <SelectItem value="topmount">Tezgah Üstü</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.sink.type !== 'none' && (
                    <div className="space-y-2">
                      <Label htmlFor="sinkHoles">Eviye Delik Sayısı</Label>
                      <Input
                        id="sinkHoles"
                        type="number"
                        value={formData.sink.holes}
                        onChange={(e) => setFormData({
                          ...formData,
                          sink: { ...formData.sink, holes: parseInt(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cooktopHole"
                      checked={formData.cooktopHole}
                      onChange={(e) => setFormData({ ...formData, cooktopHole: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="cooktopHole">Ocak Deliği</Label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="skirting"
                        checked={formData.skirting.enabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          skirting: { ...formData.skirting, enabled: e.target.checked }
                        })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="skirting">Süpürgelik</Label>
                    </div>
                    {formData.skirting.enabled && (
                      <Input
                        type="number"
                        placeholder="Yükseklik (cm)"
                        value={formData.skirting.heightCm || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          skirting: { ...formData.skirting, heightCm: parseInt(e.target.value) || undefined }
                        })}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="trim"
                        checked={formData.trim.enabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          trim: { ...formData.trim, enabled: e.target.checked }
                        })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="trim">Bordür</Label>
                    </div>
                    {formData.trim.enabled && (
                      <Input
                        placeholder="Model"
                        value={formData.trim.model || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          trim: { ...formData.trim, model: e.target.value }
                        })}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sideBox"
                        checked={formData.sideBox.enabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          sideBox: { ...formData.sideBox, enabled: e.target.checked }
                        })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="sideBox">Yan Kutu</Label>
                    </div>
                    {formData.sideBox.enabled && (
                      <Input
                        type="number"
                        placeholder="Boyut (cm)"
                        value={formData.sideBox.sizeCm || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          sideBox: { ...formData.sideBox, sizeCm: parseInt(e.target.value) || undefined }
                        })}
                      />
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="panelled"
                      checked={formData.panelled}
                      onChange={(e) => setFormData({ ...formData, panelled: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="panelled">Panel Kaplama</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="install"
                      checked={formData.install}
                      onChange={(e) => setFormData({ ...formData, install: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="install">Montaj</Label>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-lg">Adres Bilgileri</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">Şehir</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">İlçe</Label>
                    <Input
                      id="district"
                      value={formData.address.district}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, district: e.target.value }
                      })}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Hesaplanıyor...
                    </>
                  ) : (
                    'Teklif Al'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div>
            {error && (
              <Card className="mb-4 border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Hata</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {quote && (
              <Card>
                <CardHeader>
                  <CardTitle>Teklif Sonucu</CardTitle>
                  <CardDescription>
                    Fire: %{(quote.wastePercent * 100).toFixed(0)} ({quote.wasteSource})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {quote.lines.map((line, index) => (
                      <div key={index} className="flex justify-between items-start py-2 border-b">
                        <div className="flex-1">
                          <p className="font-medium">{line.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {line.quantity} {line.unit} × ₺{line.unitPrice}
                          </p>
                        </div>
                        <p className="font-semibold">₺{line.lineTotal}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 pt-4 border-t-2">
                    <div className="flex justify-between">
                      <span>Ara Toplam:</span>
                      <span className="font-semibold">₺{quote.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>KDV (%18):</span>
                      <span className="font-semibold">₺{quote.tax}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>TOPLAM:</span>
                      <span className="text-primary">₺{quote.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!quote && !error && !loading && (
              <Card>
                <CardHeader>
                  <CardTitle>Teklif Sonucu</CardTitle>
                  <CardDescription>Formu doldurup "Teklif Al" butonuna tıklayın</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Henüz teklif hesaplanmadı
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
