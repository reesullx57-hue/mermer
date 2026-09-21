'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface View3DProps {
  project: any;
}

export default function View3D({ project }: View3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const calibration = project.calibrationData
      ? JSON.parse(project.calibrationData)
      : null;

    if (!calibration) {
      setError('Kalibrasyon verileri bulunamadı');
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    let animationFrameId: number;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);

      // Camera
      const camera = new THREE.PerspectiveCamera(
        50,
        canvasRef.current.clientWidth / canvasRef.current.clientHeight,
        0.1,
        10000
      );
      camera.position.set(
        calibration.slabWidth / 150,
        calibration.slabHeight / 100,
        calibration.slabWidth / 100
      );
      camera.lookAt(
        calibration.slabWidth / 200,
        0,
        calibration.slabHeight / 200
      );

      // Renderer
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
      });
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight1.position.set(10, 10, 5);
      scene.add(directionalLight1);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
      directionalLight2.position.set(-10, 10, -5);
      scene.add(directionalLight2);

      // Slab base plane
      const slabGeometry = new THREE.PlaneGeometry(
        calibration.slabWidth / 100,
        calibration.slabHeight / 100
      );
      const slabMaterial = new THREE.MeshStandardMaterial({
        color: 0x4b5563,
        roughness: 0.7,
        metalness: 0.1,
      });

      // Try to load slab texture if available
      if (project.slabPhotoUrl) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
          project.slabPhotoUrl,
          (texture) => {
            slabMaterial.map = texture;
            slabMaterial.needsUpdate = true;
          },
          undefined,
          (err) => {
            console.warn('Failed to load slab texture:', err);
          }
        );
      }

      const slabMesh = new THREE.Mesh(slabGeometry, slabMaterial);
      slabMesh.rotation.x = -Math.PI / 2;
      slabMesh.position.set(
        calibration.slabWidth / 200,
        0,
        calibration.slabHeight / 200
      );
      scene.add(slabMesh);

      // Grid helper
      const gridSize = Math.max(calibration.slabWidth, calibration.slabHeight) / 50;
      const gridHelper = new THREE.GridHelper(gridSize, 50, 0x374151, 0x1f2937);
      scene.add(gridHelper);

      // Add pieces
      project.pieces.forEach((piece: any) => {
        const geometry = new THREE.BoxGeometry(
          piece.width / 100,
          0.2,
          piece.height / 100
        );
        const material = new THREE.MeshStandardMaterial({
          color: 0x9ca3af,
          roughness: 0.3,
          metalness: 0.1,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          piece.x / 100,
          0.1,
          piece.y / 100
        );
        mesh.rotation.y = (piece.rotation * Math.PI) / 180;

        scene.add(mesh);

        // Add edge lines for better visibility
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x3b82f6 });
        const lineSegments = new THREE.LineSegments(edges, lineMaterial);
        mesh.add(lineSegments);
      });

      // Simple orbit controls with mouse
      let cameraRotation = { x: 0.3, y: 0.3 };
      let cameraDistance = camera.position.length();
      const target = new THREE.Vector3(
        calibration.slabWidth / 200,
        0,
        calibration.slabHeight / 200
      );

      const updateCameraPosition = () => {
        const radius = cameraDistance;
        camera.position.x = target.x + radius * Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x);
        camera.position.y = target.y + radius * Math.sin(cameraRotation.x);
        camera.position.z = target.z + radius * Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x);
        camera.lookAt(target);
      };

      const handleMouseDown = (e: MouseEvent) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        cameraRotation.y += deltaX * 0.005;
        cameraRotation.x += deltaY * 0.005;

        // Clamp vertical rotation
        cameraRotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, cameraRotation.x));

        updateCameraPosition();

        previousMousePosition = { x: e.clientX, y: e.clientY };
      };

      const handleMouseUp = () => {
        isDragging = false;
      };

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        cameraDistance += e.deltaY * 0.01;
        cameraDistance = Math.max(10, Math.min(200, cameraDistance));
        updateCameraPosition();
      };

      const canvas = canvasRef.current;
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('wheel', handleWheel);

      // Animation loop
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        renderer?.render(scene, camera);
      };
      animate();

      // Handle resize
      const handleResize = () => {
        if (!canvasRef.current || !renderer) return;
        const width = canvasRef.current.clientWidth;
        const height = canvasRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('wheel', handleWheel);
        cancelAnimationFrame(animationFrameId);
        renderer?.dispose();
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(m => m.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      };
    } catch (err) {
      console.error('WebGL initialization error:', err);
      setError('3D görüntüleme başlatılamadı. Tarayıcınız WebGL desteklemiyor olabilir.');
    }
  }, [project]);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card">
          <div className="text-center py-20">
            <div className="text-red-400 text-lg mb-4">⚠️ 3D Görüntüleme Hatası</div>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">3D Önizleme</h2>
        <p className="text-gray-400 text-sm mb-4">
          Fare ile sürükleyerek döndürün, tekerlek ile yakınlaştırın
        </p>
        <div className="w-full h-[600px] bg-gray-800 rounded-lg overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
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
