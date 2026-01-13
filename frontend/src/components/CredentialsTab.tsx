import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Key, Edit2, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';

type Marketplace = 'amazon' | 'walmart';

interface CredentialsTabProps {
  apiUrl: string;
}

function CredentialsTab({ apiUrl }: CredentialsTabProps) {
  const queryClient = useQueryClient();
  const [editingMarketplace, setEditingMarketplace] = useState<Marketplace | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setSuccess('Credentials updated successfully!');
      setEditingMarketplace(null);
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to update credentials');
    },
  });

  const handleSave = (marketplace: Marketplace) => {
    if (!formData.clientId || !formData.clientSecret) {
      setError('Client ID and Client Secret are required');
      return;
    }
    updateMutation.mutate({ marketplace, credentials: formData });
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
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
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {marketplaces.map((marketplace) => {
          const cred = credentials.find((c: any) => c.marketplace === marketplace);
          const isEditing = editingMarketplace === marketplace;

          return (
            <div key={marketplace} className="bg-white border border-gray-200 rounded-lg p-6">
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
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit2 className="w-5 h-5 text-gray-600" />
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="text-sm">
                  {cred?.hasCredentials ? (
                    <span className="text-green-700">✓ Configured</span>
                  ) : (
                    <span className="text-gray-600">Not configured</span>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client ID *
                    </label>
                    <input
                      type="text"
                      value={formData.clientId || ''}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSave(marketplace)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMarketplace(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
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