'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface View3DProps {
  project: any;
}

function Piece3D({ piece, slabTexture }: { piece: any; slabTexture?: THREE.Texture }) {
  const geometry = new THREE.BoxGeometry(piece.width / 100, 2, piece.height / 100);
  
  return (
    <mesh
      position={[piece.x / 100, 1, piece.y / 100]}
      rotation={[0, (piece.rotation * Math.PI) / 180, 0]}
      geometry={geometry}
    >
      <meshStandardMaterial
        color="#9ca3af"
        map={slabTexture}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
}

function Scene({ project }: { project: any }) {
  const calibration = project.calibrationData
    ? JSON.parse(project.calibrationData)
    : null;

  if (!calibration) return null;

  return (
    <>
      <PerspectiveCamera makeDefault position={[20, 20, 20]} />
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} />

      {/* Base plane for slab */}
      <mesh position={[calibration.slabWidth / 200, 0, calibration.slabHeight / 200]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[calibration.slabWidth / 100, calibration.slabHeight / 100]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>

      {/* Pieces */}
      {project.pieces.map((piece: any) => (
        <Piece3D key={piece.id} piece={piece} />
      ))}

      {/* Grid helper */}
      <gridHelper args={[50, 50, '#374151', '#1f2937']} />
    </>
  );
}

export default function View3D({ project }: View3DProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">3D Önizleme</h2>
        <p className="text-gray-400 text-sm mb-4">
          Fare ile döndürün, yakınlaştırın ve kaydırın
        </p>
        <div className="w-full h-[600px] bg-gray-800 rounded-lg overflow-hidden">
          <Canvas>
            <Suspense fallback={null}>
              <Scene project={project} />
            </Suspense>
          </Canvas>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-gray-400">Parça Sayısı</p>
            <p className="text-white font-semibold text-lg">{project.pieces.length}</p>
          </div>
          <div>
            <p className="text-gray-400">Plaka Boyutu</p>
            <p className="text-white font-semibold text-lg">
              {project.slabWidth} × {project.slabHeight} mm
            </p>
          </div>
          <div>
            <p className="text-gray-400">Durum</p>
            <p className="text-white font-semibold text-lg">
              {project.pieces.length > 0 ? 'Hazır' : 'Taslak'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
