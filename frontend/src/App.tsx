import { useState } from 'react';
import Dashboard from './components/Dashboard';
import { Package } from 'lucide-react';

function App() {
  const [apiUrl] = useState(
    import.meta.env.VITE_API_URL || 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Marketplace Sync Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Manage Amazon & Walmart listings from one place
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard apiUrl={apiUrl} />
      </main>
    </div>
  );
}

export default App;