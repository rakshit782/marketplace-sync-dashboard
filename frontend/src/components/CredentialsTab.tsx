import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Key, Edit2, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { useState } from 'react';

type Marketplace = 'amazon' | 'walmart';

interface CredentialsTabProps {
  apiUrl: string;
}

interface AmazonCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  sellerId: string;
  marketplaceId: string;
}

interface WalmartCredentials {
  clientId: string;
  clientSecret: string;
}

const AMAZON_MARKETPLACES = [
  { id: 'ATVPDKIKX0DER', name: 'United States (amazon.com)', flag: '🇺🇸' },
  { id: 'A2EUQ1WTGCTBG2', name: 'Canada (amazon.ca)', flag: '🇨🇦' },
  { id: 'A1AM78C64UM0Y8', name: 'Mexico (amazon.com.mx)', flag: '🇲🇽' },
  { id: 'A1F83G8C2ARO7P', name: 'United Kingdom (amazon.co.uk)', flag: '🇬🇧' },
  { id: 'A1PA6795UKMFR9', name: 'Germany (amazon.de)', flag: '🇩🇪' },
  { id: 'A13V1IB3VIYZZH', name: 'France (amazon.fr)', flag: '🇫🇷' },
  { id: 'APJ6JRA9NG5V4', name: 'Italy (amazon.it)', flag: '🇮🇹' },
  { id: 'A1RKKUPIHCS9HS', name: 'Spain (amazon.es)', flag: '🇪🇸' },
  { id: 'A21TJRUUN4KGV', name: 'India (amazon.in)', flag: '🇮🇳' },
  { id: 'A1VC38T7YXB528', name: 'Japan (amazon.co.jp)', flag: '🇯🇵' },
  { id: 'A39IBJ37TRP1C6', name: 'Australia (amazon.com.au)', flag: '🇦🇺' },
];

function CredentialsTab({ apiUrl }: CredentialsTabProps) {
  const queryClient = useQueryClient();
  const [editingMarketplace, setEditingMarketplace] = useState<Marketplace | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['credentials'],
    queryFn: async () => {
      const response = await axios.get(`${apiUrl}/api/credentials`);
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ marketplace, credentials }: { marketplace: string; credentials: any }) => {
      const response = await axios.put(`${apiUrl}/api/credentials/${marketplace}`, { credentials });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      setSuccess('Credentials saved successfully! ✓');
      setEditingMarketplace(null);
      setFormData({});
      setTimeout(() => setSuccess(''), 5000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to save credentials');
      setTimeout(() => setError(''), 5000);
    },
  });

  const handleSave = (marketplace: Marketplace) => {
    setError('');
    
    if (marketplace === 'amazon') {
      if (!formData.clientId?.trim()) {
        setError('LWA Client ID is required');
        return;
      }
      if (!formData.clientSecret?.trim()) {
        setError('LWA Client Secret is required');
        return;
      }
      if (!formData.refreshToken?.trim()) {
        setError('Refresh Token is required');
        return;
      }
      if (!formData.sellerId?.trim()) {
        setError('Seller ID is required');
        return;
      }
      if (!formData.marketplaceId) {
        setError('Marketplace ID is required');
        return;
      }
    } else if (marketplace === 'walmart') {
      if (!formData.clientId?.trim() || !formData.clientSecret?.trim()) {
        setError('Client ID and Client Secret are required');
        return;
      }
    }
    
    updateMutation.mutate({ marketplace, credentials: formData });
  };

  const handleCancel = () => {
    setEditingMarketplace(null);
    setFormData({});
    setError('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const credentials = data?.data || [];
  const marketplaces: Marketplace[] = ['amazon', 'walmart'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Marketplace Credentials</h2>
        <p className="text-gray-600 mt-1">Manage API credentials for marketplace integrations</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {marketplaces.map((marketplace) => {
          const cred = credentials.find((c: any) => c.marketplace === marketplace);
          const isEditing = editingMarketplace === marketplace;

          return (
            <div key={marketplace} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{marketplace.toUpperCase()}</h3>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => {
                      setEditingMarketplace(marketplace);
                      setError('');
                      setFormData({});
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5 text-gray-600" />
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="text-sm">
                  {cred?.hasCredentials ? (
                    <span className="inline-flex items-center gap-2 text-green-700 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Configured
                    </span>
                  ) : (
                    <span className="text-gray-500">Not configured</span>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {marketplace === 'amazon' ? (
                    // Amazon SP-API Fields
                    <>
                      <div className="flex items-center justify-between mb-4 pb-3 border-b">
                        <h4 className="text-sm font-medium text-gray-700">Amazon SP-API Credentials</h4>
                        <button
                          onClick={() => setShowHelp(!showHelp)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <HelpCircle className="w-5 h-5" />
                        </button>
                      </div>

                      {showHelp && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 mb-4">
                          <p className="font-medium mb-2">How to get these credentials:</p>
                          <ol className="list-decimal ml-4 space-y-1">
                            <li>Go to <a href="https://developer.amazonservices.com" target="_blank" rel="noopener noreferrer" className="underline">Amazon Developer Console</a></li>
                            <li>Create App Client → Get Client ID & Secret</li>
                            <li>Authorize app in Seller Central</li>
                            <li>Get Refresh Token via OAuth</li>
                            <li>Find Seller ID in Account Info</li>
                          </ol>
                          <p className="mt-2">
                            <a href="https://github.com/rakshit782/marketplace-sync-dashboard/blob/main/docs/AMAZON_SPAPI_SETUP.md" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline font-medium">
                              View Complete Setup Guide →
                            </a>
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          LWA Client ID *
                        </label>
                        <input
                          type="text"
                          value={formData.clientId || ''}
                          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="amzn1.application-oa2-client.abc123..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          LWA Client Secret *
                        </label>
                        <input
                          type="password"
                          value={formData.clientSecret || ''}
                          onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="amzn1.oa2-cs.v1.abc123..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Refresh Token *
                        </label>
                        <input
                          type="password"
                          value={formData.refreshToken || ''}
                          onChange={(e) => setFormData({ ...formData, refreshToken: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Atzr|IwEBIHabc123..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Seller ID (Merchant Token) *
                        </label>
                        <input
                          type="text"
                          value={formData.sellerId || ''}
                          onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="A2EUQ1WTGCTBG2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Marketplace *
                        </label>
                        <select
                          value={formData.marketplaceId || ''}
                          onChange={(e) => setFormData({ ...formData, marketplaceId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select marketplace</option>
                          {AMAZON_MARKETPLACES.map((mp) => (
                            <option key={mp.id} value={mp.id}>
                              {mp.flag} {mp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    // Walmart Fields
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Client ID *
                        </label>
                        <input
                          type="text"
                          value={formData.clientId || ''}
                          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter Walmart Client ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Client Secret *
                        </label>
                        <input
                          type="password"
                          value={formData.clientSecret || ''}
                          onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter Walmart Client Secret"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleSave(marketplace)}
                      disabled={updateMutation.isPending}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={updateMutation.isPending}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CredentialsTab;