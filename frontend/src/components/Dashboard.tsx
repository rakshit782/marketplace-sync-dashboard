import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ProductsTable from './ProductsTable';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface DashboardProps {
  apiUrl: string;
}

function Dashboard({ apiUrl }: DashboardProps) {
  const [marketplace, setMarketplace] = useState<'amazon' | 'walmart'>('amazon');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', marketplace],
    queryFn: async () => {
      const response = await axios.post(`${apiUrl}/api/${marketplace}/products`, {
        pageSize: 20,
      });
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Marketplace Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setMarketplace('amazon')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                marketplace === 'amazon'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Amazon
            </button>
            <button
              onClick={() => setMarketplace('walmart')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                marketplace === 'walmart'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Walmart
            </button>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Products Table */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error loading products</h3>
            <p className="text-sm text-red-700 mt-1">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      ) : data?.success ? (
        <ProductsTable
          products={data.data.items || []}
          marketplace={marketplace}
          apiUrl={apiUrl}
        />
      ) : null}
    </div>
  );
}

export default Dashboard;