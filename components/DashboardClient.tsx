'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen, Trash2, Edit, LogOut } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  slabPhotoUrl: string | null;
  pieces: any[];
}

interface DashboardClientProps {
  projects: Project[];
  user: { email: string; userId: string };
}

export default function DashboardClient({ projects: initialProjects, user }: DashboardClientProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(false);

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName }),
      });

      if (res.ok) {
        const project = await res.json();
        router.push(`/project/${project.id}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Bu projeyi silmek istediğinizden emin misiniz?')) return;

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold text-white">Mermer</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">{user.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <LogOut size={18} />
                <span>Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Projelerim</h1>
          <button
            onClick={() => setShowNewProject(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Yeni Proje</span>
          </button>
        </div>

        {/* New Project Modal */}
        {showNewProject && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="card max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-4">Yeni Proje</h2>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Proje adı"
                className="input-field mb-4"
                autoFocus
              />
              <div className="flex space-x-3">
                <button
                  onClick={createProject}
                  disabled={loading || !newProjectName.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
                <button
                  onClick={() => {
                    setShowNewProject(false);
                    setNewProjectName('');
                  }}
                  className="btn-secondary flex-1"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="mx-auto mb-4 text-gray-600" size={64} />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Henüz proje yok
            </h3>
            <p className="text-gray-500 mb-6">İlk projenizi oluşturun</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Yeni Proje</span>
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card group hover:border-blue-800 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {project.name}
                  </h3>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="space-y-2 text-sm text-gray-400 mb-4">
                  <p>{project.pieces.length} parça</p>
                  <p className="text-xs">
                    Güncelleme: {new Date(project.updatedAt).toLocaleDateString('tr')}
                  </p>
                </div>

                <Link
                  href={`/project/${project.id}`}
                  className="btn-primary w-full text-center inline-block"
                >
                  Aç
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
