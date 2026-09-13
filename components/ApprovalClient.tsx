'use client';

import { useState, useEffect } from 'react';
import { Check, Box, Layout } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

interface ApprovalClientProps {
  approval: any;
}

function Scene3D({ project }: { project: any }) {
  const calibration = project.calibrationData
    ? JSON.parse(project.calibrationData)
    : null;

  if (!calibration) return null;

  return (
    <>
      <PerspectiveCamera makeDefault position={[20, 20, 20]} />
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} />

      <mesh position={[calibration.slabWidth / 200, 0, calibration.slabHeight / 200]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[calibration.slabWidth / 100, calibration.slabHeight / 100]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>

      {project.pieces.map((piece: any) => {
        const geometry = { width: piece.width / 100, height: piece.height / 100 };
        return (
          <mesh
            key={piece.id}
            position={[piece.x / 100, 1, piece.y / 100]}
            rotation={[0, (piece.rotation * Math.PI) / 180, 0]}
          >
            <boxGeometry args={[geometry.width, 2, geometry.height]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.1} />
          </mesh>
        );
      })}

      <gridHelper args={[50, 50, '#374151', '#1f2937']} />
    </>
  );
}

export default function ApprovalClient({ approval }: ApprovalClientProps) {
  const [clientName, setClientName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [approved, setApproved] = useState(!!approval.approvedAt);

  const handleApprove = async () => {
    if (!clientName.trim()) {
      alert('Lütfen adınızı girin');
      return;
    }

    if (!confirm('Bu tasarımı onaylıyor musunuz? Bu işlem geri alınamaz.')) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/approval/${approval.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName }),
      });

      if (res.ok) {
        setApproved(true);
      }
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Onay başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const project = approval.project;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold text-white">Mermer</span>
            </div>
            {approved && (
              <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full flex items-center space-x-2">
                <Check size={18} />
                <span>Onaylandı</span>
              </span>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
          <p className="text-gray-400">
            Tasarımı inceleyin ve onaylayın
          </p>
        </div>

        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setView('2d')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              view === '2d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Layout size={20} />
            <span>2D Görünüm</span>
          </button>
          <button
            onClick={() => setView('3d')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              view === '3d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Box size={20} />
            <span>3D Görünüm</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card">
              {view === '2d' ? (
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">2D Yerleşim Görünümü</p>
                </div>
              ) : (
                <div className="w-full h-[600px] bg-gray-800 rounded-lg overflow-hidden">
                  <Canvas>
                    <Scene3D project={project} />
                  </Canvas>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Proje Detayları</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400">Plaka Boyutu</p>
                  <p className="text-white font-medium">
                    {project.slabWidth} × {project.slabHeight} mm
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Parça Sayısı</p>
                  <p className="text-white font-medium">{project.pieces.length}</p>
                </div>
              </div>
            </div>

            {!approved ? (
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4">Onay</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Adınız Soyadınız
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="input-field"
                      placeholder="Adınız Soyadınız"
                    />
                  </div>
                  <button
                    onClick={handleApprove}
                    disabled={submitting || !clientName.trim()}
                    className="btn-primary w-full disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Check size={20} />
                    <span>{submitting ? 'Onaylanıyor...' : 'Tasarımı Onayla'}</span>
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    Onayladığınızda bu tasarım kilitlenecek ve üretim başlayacaktır.
                  </p>
                </div>
              </div>
            ) : (
              <div className="card bg-green-900/20 border-green-800">
                <div className="flex items-start space-x-3">
                  <Check className="text-green-400 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-2">
                      Tasarım Onaylandı
                    </h3>
                    <p className="text-gray-300 text-sm mb-2">
                      {approval.clientName} tarafından onaylandı
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(approval.approvedAt).toLocaleString('tr')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
