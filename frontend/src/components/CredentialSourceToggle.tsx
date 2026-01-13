import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Settings, Database, FileText, Cloud, Check, X } from 'lucide-react';

interface CredentialSourceToggleProps {
  apiUrl: string;
}

type CredentialSource = 'dotenv' | 'neon' | 'ssm';

function CredentialSourceToggle({ apiUrl }: CredentialSourceToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<CredentialSource>('ssm');

  // Fetch current source
  const { data: currentSourceData } = useQuery({
    queryKey: ['credential-source'],
    queryFn: async () => {
      const response = await axios.get(`${apiUrl}/api/config/source`);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (currentSourceData?.source) {
      setSelectedSource(currentSourceData.source);
    }
  }, [currentSourceData]);

  // Update source mutation
  const updateSourceMutation = useMutation({
    mutationFn: async (source: CredentialSource) => {
      const response = await axios.post(`${apiUrl}/api/config/source`, {
        source,
      });
      return response.data;
    },
    onSuccess: () => {
      setIsOpen(false);
    },
  });

  const handleSourceChange = (source: CredentialSource) => {
    if (source !== selectedSource) {
      updateSourceMutation.mutate(source);
    }
  };

  const sources = [
    {
      id: 'ssm' as CredentialSource,
      name: 'AWS Parameter Store',
      icon: Cloud,
      description: 'Secure, encrypted credentials in AWS SSM',
      recommended: true,
    },
    {
      id: 'neon' as CredentialSource,
      name: 'Neon Database',
      icon: Database,
      description: 'Store credentials in your Neon PostgreSQL database',
      recommended: false,
    },
    {
      id: 'dotenv' as CredentialSource,
      name: 'Environment Variables',
      icon: FileText,
      description: 'Load from .env file (development only)',
      recommended: false,
    },
  ];

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm font-medium">Credential Source</span>
        {currentSourceData?.source && (
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
            {currentSourceData.source.toUpperCase()}
          </span>
        )}
      </button>

      {/* Dropdown Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Credential Source
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose where to load API credentials from
              </p>
            </div>

            <div className="p-4 space-y-3">
              {sources.map((source) => {
                const Icon = source.icon;
                const isSelected = selectedSource === source.id;
                const isUpdating =
                  updateSourceMutation.isPending &&
                  updateSourceMutation.variables === source.id;

                return (
                  <button
                    key={source.id}
                    onClick={() => handleSourceChange(source.id)}
                    disabled={isUpdating}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded ${
                          isSelected ? 'bg-blue-100' : 'bg-gray-100'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isSelected ? 'text-blue-600' : 'text-gray-600'
                          }`}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {source.name}
                          </h4>
                          {source.recommended && (
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {source.description}
                        </p>
                      </div>

                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-600 mt-1" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Status */}
            {updateSourceMutation.isError && (
              <div className="p-4 border-t border-gray-200 bg-red-50">
                <div className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">
                      Failed to update source
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {updateSourceMutation.error instanceof Error
                        ? updateSourceMutation.error.message
                        : 'Unknown error'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {updateSourceMutation.isSuccess && (
              <div className="p-4 border-t border-gray-200 bg-green-50">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Source updated successfully
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Credentials will now be loaded from{' '}
                      {selectedSource.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CredentialSourceToggle;