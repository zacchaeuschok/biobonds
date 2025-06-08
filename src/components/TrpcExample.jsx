import { useState } from 'react';
import { trpc } from '../utils/trpc';

export function TrpcExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Not connected');

  // Example query using tRPC
  const bondsQuery = trpc.bonds.getAll.useQuery(undefined, {
    enabled: false, // Don't fetch automatically
    onSuccess: () => {
      setConnectionStatus('Connected successfully! Data received.');
      setIsLoading(false);
      setError(null);
    },
    onError: (err) => {
      setConnectionStatus('Connection failed');
      setError(err.message);
      setIsLoading(false);
    }
  });

  const handleTestConnection = () => {
    setIsLoading(true);
    setError(null);
    setConnectionStatus('Connecting...');
    bondsQuery.refetch();
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md flex flex-col gap-4 my-4">
      <h2 className="text-xl font-bold">tRPC Connection Test</h2>
      
      <div className="flex flex-col gap-2">
        <div>
          <span className="font-semibold">Status: </span>
          <span className={connectionStatus.includes('Connected successfully') ? 'text-green-600' : 
                          connectionStatus === 'Connecting...' ? 'text-yellow-600' : 
                          connectionStatus === 'Connection failed' ? 'text-red-600' : 'text-gray-600'}>
            {connectionStatus}
          </span>
        </div>
        
        {error && (
          <div className="text-red-600 text-sm">
            <span className="font-semibold">Error: </span>
            {error}
          </div>
        )}
        
        {bondsQuery.data && (
          <div className="mt-4">
            <h3 className="font-semibold">Bonds Data:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs mt-2 max-h-40 overflow-auto">
              {JSON.stringify(bondsQuery.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <button
        onClick={handleTestConnection}
        disabled={isLoading}
        className={`px-4 py-2 rounded ${
          isLoading 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isLoading ? 'Connecting...' : 'Test Connection'}
      </button>
    </div>
  );
}
