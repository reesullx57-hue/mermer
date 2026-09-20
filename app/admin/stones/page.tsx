'use client';

import { useState } from 'react';
import { Gem } from 'lucide-react';
import { ToastContainer } from '@/components/Toast';
import StoneBrandsTab from './StoneBrandsTab';
import StoneColorsTab from './StoneColorsTab';

type TabId = 'brands' | 'colors';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'brands', label: 'Markalar' },
  { id: 'colors', label: 'Renkler' },
];

export default function StonesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('brands');

  return (
    <div>
      <ToastContainer />
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gem className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Taş Kataloğu Yönetimi</h1>
        </div>
        <p className="text-gray-600">
          Taş markaları ve renklerini yönetin
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'brands' && <StoneBrandsTab />}
        {activeTab === 'colors' && <StoneColorsTab />}
      </div>
    </div>
  );
}
