'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, RotateCw, FlipHorizontal, Square } from 'lucide-react';

interface LayoutStepProps {
  project: any;
  onUpdate: (pieces: any[]) => void;
}

interface Piece {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipped: boolean;
  geometry: any;
}

export default function LayoutStep({ project, onUpdate }: LayoutStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pieces, setPieces] = useState<Piece[]>(project.pieces || []);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const calibration = project.calibrationData
    ? JSON.parse(project.calibrationData)
    : null;

  useEffect(() => {
    drawCanvas();
  }, [pieces, selectedPiece, scale]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !calibration) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvas.parentElement?.clientWidth || 1200;
    const aspectRatio = calibration.slabHeight / calibration.slabWidth;
    
    canvas.width = canvasWidth;
    canvas.height = canvasWidth * aspectRatio;

    const scaleX = canvas.width / calibration.slabWidth;
    const scaleY = canvas.height / calibration.slabHeight;
    const drawScale = Math.min(scaleX, scaleY) * scale;

    // Draw background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    const gridSize = 100 * drawScale;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw slab image if available
    if (project.slabPhotoUrl) {
      const img = new Image();
      img.src = project.slabPhotoUrl;
      if (img.complete) {
        ctx.globalAlpha = 0.6;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
      }
    }

    // Draw pieces
    pieces.forEach((piece) => {
      const isSelected = piece.id === selectedPiece;

      ctx.save();
      ctx.translate(piece.x * drawScale, piece.y * drawScale);
      ctx.rotate((piece.rotation * Math.PI) / 180);
      if (piece.flipped) {
        ctx.scale(-1, 1);
      }

      // Draw piece rectangle
      ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(147, 51, 234, 0.2)';
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#9333ea';
      ctx.lineWidth = 2;
      ctx.fillRect(0, 0, piece.width * drawScale, piece.height * drawScale);
      ctx.strokeRect(0, 0, piece.width * drawScale, piece.height * drawScale);

      // Draw piece name
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        piece.name,
        (piece.width * drawScale) / 2,
        (piece.height * drawScale) / 2
      );

      ctx.restore();
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !calibration) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvas.width / calibration.slabWidth;
    const scaleY = canvas.height / calibration.slabHeight;
    const drawScale = Math.min(scaleX, scaleY) * scale;

    // Find clicked piece
    for (let i = pieces.length - 1; i >= 0; i--) {
      const piece = pieces[i];
      const px = piece.x * drawScale;
      const py = piece.y * drawScale;
      const pw = piece.width * drawScale;
      const ph = piece.height * drawScale;

      if (x >= px && x <= px + pw && y >= py && y <= py + ph) {
        setSelectedPiece(piece.id);
        setDragging(true);
        setDragStart({ x: x - px, y: y - py });
        return;
      }
    }

    setSelectedPiece(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !selectedPiece || !calibration) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvas.width / calibration.slabWidth;
    const scaleY = canvas.height / calibration.slabHeight;
    const drawScale = Math.min(scaleX, scaleY) * scale;

    const newPieces = pieces.map((piece) => {
      if (piece.id === selectedPiece) {
        return {
          ...piece,
          x: (x - dragStart.x) / drawScale,
          y: (y - dragStart.y) / drawScale,
        };
      }
      return piece;
    });

    setPieces(newPieces);
  };

  const handleCanvasMouseUp = () => {
    if (dragging) {
      setDragging(false);
      savePieces(pieces);
    }
  };

  const addPiece = () => {
    const newPiece: Piece = {
      id: `piece-${Date.now()}`,
      name: `Parça ${pieces.length + 1}`,
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 800,
      height: 600,
      rotation: 0,
      flipped: false,
      geometry: {
        width: 800,
        height: 600,
        points: [
          { x: 0, y: 0 },
          { x: 800, y: 0 },
          { x: 800, y: 600 },
          { x: 0, y: 600 },
        ],
      },
    };

    const updated = [...pieces, newPiece];
    setPieces(updated);
    setSelectedPiece(newPiece.id);
    savePieces(updated);
  };

  const deletePiece = (id: string) => {
    const updated = pieces.filter((p) => p.id !== id);
    setPieces(updated);
    if (selectedPiece === id) {
      setSelectedPiece(null);
    }
    savePieces(updated);
  };

  const rotatePiece = (id: string) => {
    const updated = pieces.map((p) =>
      p.id === id ? { ...p, rotation: (p.rotation + 15) % 360 } : p
    );
    setPieces(updated);
    savePieces(updated);
  };

  const flipPiece = (id: string) => {
    const updated = pieces.map((p) =>
      p.id === id ? { ...p, flipped: !p.flipped } : p
    );
    setPieces(updated);
    savePieces(updated);
  };

  const savePieces = async (updatedPieces: Piece[]) => {
    try {
      await fetch(`/api/projects/${project.id}/pieces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pieces: updatedPieces }),
      });
      onUpdate(updatedPieces);
    } catch (error) {
      console.error('Failed to save pieces:', error);
    }
  };

  if (!calibration) {
    return (
      <div className="text-center text-gray-400">
        Önce kalibrasyonu tamamlayın
      </div>
    );
  }

  const selected = pieces.find((p) => p.id === selectedPiece);

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Parça Yerleşimi</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                className="btn-secondary px-3 py-1 text-sm"
              >
                -
              </button>
              <span className="text-gray-400 text-sm">{(scale * 100).toFixed(0)}%</span>
              <button
                onClick={() => setScale(Math.min(2, scale + 0.1))}
                className="btn-secondary px-3 py-1 text-sm"
              >
                +
              </button>
            </div>
          </div>
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="w-full border border-gray-700 rounded-lg cursor-move"
          />
        </div>
      </div>

      <div>
        <div className="card mb-4">
          <button onClick={addPiece} className="btn-primary w-full flex items-center justify-center space-x-2">
            <Plus size={20} />
            <span>Parça Ekle</span>
          </button>
        </div>

        {selected && (
          <div className="card mb-4">
            <h3 className="text-lg font-semibold text-white mb-3">
              {selected.name}
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => rotatePiece(selected.id)}
                className="btn-secondary w-full flex items-center justify-center space-x-2"
              >
                <RotateCw size={18} />
                <span>Döndür (15°)</span>
              </button>
              <button
                onClick={() => flipPiece(selected.id)}
                className="btn-secondary w-full flex items-center justify-center space-x-2"
              >
                <FlipHorizontal size={18} />
                <span>Çevir</span>
              </button>
              <button
                onClick={() => deletePiece(selected.id)}
                className="bg-red-600 hover:bg-red-700 text-white w-full py-2 rounded-lg flex items-center justify-center space-x-2"
              >
                <Trash2 size={18} />
                <span>Sil</span>
              </button>
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-3">
            Parçalar ({pieces.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pieces.map((piece) => (
              <div
                key={piece.id}
                onClick={() => setSelectedPiece(piece.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  piece.id === selectedPiece
                    ? 'bg-blue-600/30 border border-blue-500'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white">{piece.name}</p>
                    <p className="text-xs text-gray-400">
                      {piece.width} × {piece.height} mm
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePiece(piece.id);
                    }}
                    className="text-gray-500 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
