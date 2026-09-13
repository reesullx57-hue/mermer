'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Check } from 'lucide-react';

interface CalibrationStepProps {
  project: any;
  onPhotoUploaded?: (photoUrl: string) => void;
  onCalibrated?: (calibrationData: any, width: number, height: number) => void;
}

interface Point {
  x: number;
  y: number;
}

export default function CalibrationStep({
  project,
  onPhotoUploaded,
  onCalibrated,
}: CalibrationStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [corners, setCorners] = useState<Point[]>([]);
  const [slabWidth, setSlabWidth] = useState<string>('2400');
  const [slabHeight, setSlabHeight] = useState<string>('1400');
  const [unit, setUnit] = useState<'mm' | 'inch'>('mm');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (project.slabPhotoUrl) {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        drawCanvas(img, corners);
      };
      img.src = project.slabPhotoUrl;
    }
  }, [project.slabPhotoUrl]);

  useEffect(() => {
    if (image) {
      drawCanvas(image, corners);
    }
  }, [corners, image]);

  const drawCanvas = (img: HTMLImageElement, points: Point[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxWidth = canvas.parentElement?.clientWidth || 800;
    const scale = Math.min(maxWidth / img.width, 600 / img.height, 1);

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw corner points
    points.forEach((point, i) => {
      ctx.fillStyle = '#3b82f6';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(String(i + 1), point.x - 4, point.y + 5);
    });

    // Draw lines between corners
    if (points.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      if (points.length === 4) {
        ctx.closePath();
      }
      ctx.stroke();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (corners.length >= 4) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCorners([...corners, { x, y }]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', project.id);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onPhotoUploaded?.(data.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCalibrate = () => {
    if (corners.length !== 4) return;

    const w = parseFloat(slabWidth);
    const h = parseFloat(slabHeight);

    if (!w || !h) return;

    const calibrationData = {
      corners,
      slabWidth: w,
      slabHeight: h,
    };

    onCalibrated?.(calibrationData, w, h);
  };

  if (!project.slabPhotoUrl) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <Upload className="mx-auto mb-4 text-gray-400" size={64} />
          <h2 className="text-2xl font-bold text-white mb-4">
            Plaka Fotoğrafı Yükleyin
          </h2>
          <p className="text-gray-400 mb-6">
            Telefonunuzla çektiğiniz plaka fotoğrafını yükleyin
          </p>
          <label className="btn-primary inline-flex items-center space-x-2 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <Upload size={20} />
            <span>{uploading ? 'Yükleniyor...' : 'Fotoğraf Seç'}</span>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">
              Plaka Köşelerini İşaretleyin
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              4 köşeye tıklayın (sol üst, sağ üst, sağ alt, sol alt sırasıyla)
            </p>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full border border-gray-700 rounded-lg cursor-crosshair"
            />
            {corners.length < 4 && (
              <p className="text-sm text-blue-400 mt-2">
                {4 - corners.length} köşe daha işaretleyin
              </p>
            )}
            {corners.length === 4 && (
              <button
                onClick={() => setCorners([])}
                className="btn-secondary mt-2"
              >
                Sıfırla
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">
              Gerçek Boyutlar
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Genişlik
                </label>
                <input
                  type="number"
                  value={slabWidth}
                  onChange={(e) => setSlabWidth(e.target.value)}
                  className="input-field"
                  placeholder="2400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Yükseklik
                </label>
                <input
                  type="number"
                  value={slabHeight}
                  onChange={(e) => setSlabHeight(e.target.value)}
                  className="input-field"
                  placeholder="1400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Birim
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setUnit('mm')}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      unit === 'mm'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300'
                    }`}
                  >
                    mm
                  </button>
                  <button
                    onClick={() => setUnit('inch')}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      unit === 'inch'
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-300'
                    }`}
                  >
                    inch
                  </button>
                </div>
              </div>

              <button
                onClick={handleCalibrate}
                disabled={corners.length !== 4 || !slabWidth || !slabHeight}
                className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Check size={20} />
                <span>Kalibrasyonu Tamamla</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
