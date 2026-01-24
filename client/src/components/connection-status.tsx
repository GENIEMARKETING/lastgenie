'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { testApiConnection, getEnvironmentInfo } from '@/lib/api-debug';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export default function ConnectionStatus({ 
  className = '', 
  showDetails = false 
}: ConnectionStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    latency?: number;
    error?: string;
    lastChecked?: Date;
  }>({ connected: true });
  
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const result = await testApiConnection();
      setConnectionStatus({
        ...result,
        lastChecked: new Date()
      });
    } catch (error) {
      setConnectionStatus({
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date()
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check connection on mount
    checkConnection();
    
    // Check periodically (every 30 seconds)
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!showDetails && connectionStatus.connected) {
    return null; // Don't show anything when connected and details not requested
  }

  const getStatusColor = () => {
    if (isChecking) return 'text-yellow-500';
    return connectionStatus.connected ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />;
    }
    return connectionStatus.connected ? 
      <Wifi className="h-4 w-4" /> : 
      <WifiOff className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    if (connectionStatus.connected) {
      return connectionStatus.latency ? 
        `Connected (${connectionStatus.latency}ms)` : 
        'Connected';
    }
    return 'Disconnected';
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className={getStatusColor()}>
        {getStatusIcon()}
      </span>
      <span className={`text-sm ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      
      {!connectionStatus.connected && connectionStatus.error && (
        <div className="flex items-center gap-1">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-xs text-red-500" title={connectionStatus.error}>
            Error
          </span>
        </div>
      )}
      
      {showDetails && process.env.NODE_ENV === 'development' && (
        <button
          onClick={checkConnection}
          disabled={isChecking}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 disabled:opacity-50"
        >
          Refresh
        </button>
      )}
    </div>
  );
}

/**
 * Debug panel component for development
 */
export function ApiDebugPanel() {
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setEnvInfo(getEnvironmentInfo());
    }
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600"
        title="Toggle API Debug Panel"
      >
        🔧
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">API Debug Panel</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <strong>Connection Status:</strong>
              <ConnectionStatus showDetails className="ml-2" />
            </div>
            
            {envInfo && (
              <div>
                <strong>Environment:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                  {JSON.stringify(envInfo, null, 2)}
                </pre>
              </div>
            )}
            
            <div>
              <strong>Quick Tests:</strong>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => testApiConnection().then(console.log)}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                >
                  Test API
                </button>
                <button
                  onClick={() => console.log('Local Storage:', localStorage.getItem('lastgenie_cart'))}
                  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                >
                  Check Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}