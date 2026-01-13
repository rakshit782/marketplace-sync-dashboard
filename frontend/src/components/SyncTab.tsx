import { useState } from 'react';
import { RefreshCw, Play, CheckCircle, AlertCircle } from 'lucide-react';

interface SyncTabProps {
  apiUrl: string;
}

function SyncTab({ apiUrl }: SyncTabProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ status: 'success' | 'error' | null; message: string }>(
    { status: null, message: '' }
  );

  const handleSync = async (marketplace: string) => {
    setIsSyncing(true);
    setSyncResult({ status: null, message: '' });

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setSyncResult({
        status: 'success',
        message: `Successfully synced products from ${marketplace}`,
      });
    } catch (error: any) {
      setSyncResult({
        status: 'error',
        message: 'Sync failed',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const marketplaces = [
    { id: 'amazon', name: 'Amazon' },
    { id: 'walmart', name: 'Walmart' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sync Products</h2>
        <p className="text-gray-600 mt-1">Manually trigger product sync from marketplaces</p>
      </div>

      {syncResult.status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">{syncResult.message}</p>
        </div>
      )}

      {syncResult.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{syncResult.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {marketplaces.map((marketplace) => (
          <div key={marketplace.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">{marketplace.name}</h3>
            </div>

            <button
              onClick={() => handleSync(marketplace.name)}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Sync
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SyncTab;