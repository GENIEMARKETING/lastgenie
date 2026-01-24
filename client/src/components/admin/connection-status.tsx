'use client';

import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useAdmin } from '@/contexts/admin-context';
import { useSSE } from '@/lib/sse-client';

export default function ConnectionStatus() {
  const { state } = useAdmin();
  const { isSSEConnected, connectionStatus } = state;
  const { reconnect } = useSSE();

  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <Wifi className="h-4 w-4" />,
          text: 'Connected',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'polling':
        return {
          icon: <RefreshCw className="h-4 w-4" />,
          text: 'Polling Mode',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'connecting':
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          text: 'Connecting...',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Connection Error',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'failed':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Connection Failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Disconnected',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const showReconnectButton = ['error', 'failed'].includes(connectionStatus) || 
                            (!isSSEConnected && connectionStatus !== 'connecting');

  return (
    <div className="flex items-center gap-2">
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
        <span className={statusInfo.color}>
          {statusInfo.icon}
        </span>
        <span className={`${statusInfo.color} font-medium`}>
          {statusInfo.text}
        </span>
        {isSSEConnected && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>
      
      {showReconnectButton && (
        <button
          onClick={reconnect}
          className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          title="Reconnect to real-time updates"
        >
          Reconnect
        </button>
      )}
    </div>
  );
}