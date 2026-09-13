'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  Ruler,
  Layout,
  Box,
  Share2,
  Download,
  Save,
} from 'lucide-react';
import CalibrationStep from './CalibrationStep';
import LayoutStep from './LayoutStep';
import View3D from './View3D';

interface Project {
  id: string;
  name: string;
  slabPhotoUrl: string | null;
  slabWidth: number | null;
  slabHeight: number | null;
  calibrationData: string | null;
  pieces: any[];
  approvals: any[];
}

interface ProjectEditorProps {
  project: Project;
}

type Step = 'upload' | 'calibrate' | 'layout' | '3d';

export default function ProjectEditor({ project: initialProject }: ProjectEditorProps) {
  const [project, setProject] = useState(initialProject);
  const [currentStep, setCurrentStep] = useState<Step>(
    !project.slabPhotoUrl
      ? 'upload'
      : !project.calibrationData
      ? 'calibrate'
      : 'layout'
  );
  const [saving, setSaving] = useState(false);

  const isApproved = project.approvals.some((a) => a.approvedAt);

  const saveProject = async (updates: Partial<Project>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updated = await res.json();
        setProject({ ...project, ...updated });
      }
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setSaving(false);
    }
  };

  const exportDXF = async () => {
    try {
      const res = await fetch(`/api/export/dxf/${project.id}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}.dxf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export DXF:', error);
    }
  };

  const createApprovalLink = async () => {
    try {
      const res = await fetch(`/api/approval/${project.id}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        const url = `${window.location.origin}/approval/${data.token}`;
        navigator.clipboard.writeText(url);
        alert(`Onay linki kopyalandı:\n${url}`);
      }
    } catch (error) {
      console.error('Failed to create approval link:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Geri</span>
              </Link>
              <div className="w-px h-6 bg-gray-700"></div>
              <h1 className="text-xl font-semibold text-white">{project.name}</h1>
              {isApproved && (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                  Onaylandı ✓
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {saving && <span className="text-sm text-gray-400">Kaydediliyor...</span>}
              <button
                onClick={createApprovalLink}
                disabled={!project.pieces.length || isApproved}
                className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
              >
                <Share2 size={18} />
                <span>Paylaş</span>
              </button>
              <button
                onClick={exportDXF}
                disabled={!project.pieces.length}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Download size={18} />
                <span>DXF İndir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Step Navigation */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'upload', icon: Camera, label: 'Fotoğraf' },
              { id: 'calibrate', icon: Ruler, label: 'Kalibrasyon' },
              { id: 'layout', icon: Layout, label: 'Yerleşim' },
              { id: '3d', icon: Box, label: '3D Önizleme' },
            ].map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isComplete =
                (step.id === 'upload' && project.slabPhotoUrl) ||
                (step.id === 'calibrate' && project.calibrationData) ||
                (step.id === 'layout' && project.pieces.length > 0);

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id as Step)}
                  disabled={
                    (step.id === 'calibrate' && !project.slabPhotoUrl) ||
                    ((step.id === 'layout' || step.id === '3d') && !project.calibrationData)
                  }
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isActive
                      ? 'border-blue-500 text-white'
                      : isComplete
                      ? 'border-transparent text-green-400 hover:text-white'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{step.label}</span>
                  {isComplete && <span className="text-green-400">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">
          {currentStep === 'upload' && (
            <CalibrationStep
              project={project}
              onPhotoUploaded={(photoUrl) => {
                saveProject({ slabPhotoUrl: photoUrl });
                setCurrentStep('calibrate');
              }}
            />
          )}

          {currentStep === 'calibrate' && project.slabPhotoUrl && (
            <CalibrationStep
              project={project}
              onCalibrated={(calibrationData, width, height) => {
                saveProject({
                  calibrationData: JSON.stringify(calibrationData),
                  slabWidth: width,
                  slabHeight: height,
                });
                setCurrentStep('layout');
              }}
            />
          )}

          {currentStep === 'layout' && project.calibrationData && (
            <LayoutStep
              project={project}
              onUpdate={(pieces) => {
                setProject({ ...project, pieces });
              }}
            />
          )}

          {currentStep === '3d' && project.calibrationData && (
            <View3D project={project} />
          )}
        </div>
      </div>
    </div>
  );
}
