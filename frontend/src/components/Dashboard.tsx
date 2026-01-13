import { useState } from 'react';
import ProductsTab from './ProductsTab';
import CredentialsTab from './CredentialsTab';
import SyncTab from './SyncTab';
import { Package, Key, RefreshCw } from 'lucide-react';

interface DashboardProps {
  apiUrl: string;
}

type Tab = 'products' | 'credentials' | 'sync';

function Dashboard({ apiUrl }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('products');

  const tabs = [
    { id: 'products' as Tab, label: 'Products', icon: Package },
    { id: 'credentials' as Tab, label: 'Credentials', icon: Key },
    { id: 'sync' as Tab, label: 'Sync', icon: RefreshCw },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'products' && <ProductsTab apiUrl={apiUrl} />}
        {activeTab === 'credentials' && <CredentialsTab apiUrl={apiUrl} />}
        {activeTab === 'sync' && <SyncTab apiUrl={apiUrl} />}
      </div>
    </div>
  );
}

export default Dashboard;