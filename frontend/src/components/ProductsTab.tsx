import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Package, Search, Filter, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface Product {
  sku: string;
  marketplace: string;
  title: string;
  brand?: string;
  price?: number;
  currency?: string;
  inventory_quantity?: number;
  image_url?: string;
  updated_at: string;
}

interface ProductsTabProps {
  apiUrl: string;
}

function ProductsTab({ apiUrl }: ProductsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', marketplaceFilter],
    queryFn: async () => {
      const params = marketplaceFilter !== 'all' ? { marketplace: marketplaceFilter } : {};
      const response = await axios.get(`${apiUrl}/api/products`, { params });
      return response.data;
    },
  });

  const products: Product[] = data?.data || [];

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">Error loading products</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-gray-600 mt-1">{filteredProducts.length} products found</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <select
          value={marketplaceFilter}
          onChange={(e) => setMarketplaceFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Marketplaces</option>
          <option value="amazon">Amazon</option>
          <option value="walmart">Walmart</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Add credentials and run a sync to import products</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.sku}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {product.image_url && (
                <div className="aspect-square bg-gray-100">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-4">
                <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                  {product.marketplace.toUpperCase()}
                </span>

                <h3 className="font-medium text-gray-900 mt-2 line-clamp-2">
                  {product.title}
                </h3>

                <div className="mt-4 flex items-center justify-between">
                  {product.price && (
                    <div className="text-lg font-bold text-gray-900">
                      ${product.price.toFixed(2)}
                    </div>
                  )}
                  {product.inventory_quantity !== undefined && (
                    <div className="text-sm text-gray-600">
                      {product.inventory_quantity} in stock
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductsTab;