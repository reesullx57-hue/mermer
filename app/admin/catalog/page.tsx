'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import ThicknessesTab from './ThicknessesTab';
import FormTypesTab from './FormTypesTab';
import EdgeTypesTab from './EdgeTypesTab';
import { ToastContainer } from '@/components/Toast';

type TabType = 'thicknesses' | 'form-types' | 'edge-types';

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<TabType>('thicknesses');

  const tabs = [
    { id: 'thicknesses' as TabType, label: 'Kalınlıklar' },
    { id: 'form-types' as TabType, label: 'Form Tipleri' },
    { id: 'edge-types' as TabType, label: 'Kenar Tipleri' },
  ];

  return (
    <div>
      <ToastContainer />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Katalog Yönetimi</h1>
        </div>
        <p className="text-gray-600">
          Fiyatlandırma katsayıları ve katalog yapılandırması
        </p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div>
        {activeTab === 'thicknesses' && <ThicknessesTab />}
        {activeTab === 'form-types' && <FormTypesTab />}
        {activeTab === 'edge-types' && <EdgeTypesTab />}
      </div>
    </div>
  );
}
