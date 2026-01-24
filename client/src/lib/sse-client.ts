const SSE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface SSEEvent {
  type: string;
  data: any;
  id?: string;
}

export type SSEEventHandler = (event: SSEEvent) => void;

class SSEClient {
  private eventSource: EventSource | null = null;
  private eventHandlers: Map<string, SSEEventHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor() {
    // Bind methods to preserve context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
  }

  /**
   * Connect to the SSE endpoint
   */
  connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    try {
      this.eventSource = new EventSource(`${SSE_URL}/admin/events`, {
        withCredentials: true
      });

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.warn('SSE connection timeout - falling back to polling');
          this.fallbackToPolling();
        }
      }, 10000);

      this.eventSource.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('SSE connection opened');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emitEvent('connection', { status: 'connected' });
      };

      this.eventSource.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('SSE connection error:', error);
        this.isConnected = false;
        this.emitEvent('error', { error });

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            30000 // Max 30 seconds
          );
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
          
          setTimeout(() => {
            this.connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached - falling back to polling');
          this.emitEvent('max_reconnect_attempts', { attempts: this.reconnectAttempts });
          this.fallbackToPolling();
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emitEvent('message', data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      // Register specific event listeners
      this.registerEventListeners();

    } catch (error) {
      console.error('Error creating SSE connection:', error);
      this.emitEvent('error', { error });
    }
  }

  /**
   * Disconnect from the SSE endpoint
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      console.log('SSE connection closed');
      this.emitEvent('disconnection', { status: 'disconnected' });
    }
    
    // Also stop polling if active
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
    }
  }

  /**
   * Fallback to polling when SSE is not available
   */
  private fallbackToPolling(): void {
    if (this.isPolling) return;

    console.log('Falling back to polling for real-time updates');
    this.isPolling = true;
    
    this.pollingInterval = setInterval(async () => {
      try {
        // Poll for dashboard updates
        const response = await fetch('/api/admin/dashboard/stats', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          this.emitEvent('dashboard_update', data);
        }
      } catch (error) {
        console.error('Polling failed:', error);
      }
    }, 30000); // Poll every 30 seconds

    this.emitEvent('connection', { status: 'polling', fallback: true });
  }

  /**
   * Check if connected
   */
  isConnectedToSSE(): boolean {
    return this.isConnected && this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Manual reconnect - resets attempts and tries to reconnect
   */
  reconnect(): void {
    console.log('Manual reconnect requested');
    this.reconnectAttempts = 0;
    this.disconnect();
    this.connect();
  }

  /**
   * Register event listeners for specific SSE events
   */
  private registerEventListeners(): void {
    if (!this.eventSource) return;

    // Connection events
    this.eventSource.addEventListener('connection', (event) => {
      const data = JSON.parse(event.data);
      this.emitEvent('connection', data);
    });

    // Inventory events
    this.eventSource.addEventListener('inventory_update', (event) => {
      const data = JSON.parse(event.data);
      this.emitEvent('inventory_update', data);
    });

    this.eventSource.addEventListener('low_stock_alert', (event) => {
      const data = JSON.parse(event.data);
      this.emitEvent('low_stock_alert', data);
    });

    this.eventSource.addEventListener('stock_restock', (event) => {
      const data = JSON.parse(event.data);
      this.emitEvent('stock_restock', data);
    });

    // Order events
    this.eventSource.addEventListener('new_order', (event) => {
      const data = JSON.parse(event.data);
      this.emitEvent('new_order', data);
    });

    this.eventSource.addEventListener('order_status_update', (event) => {
      const data = JSON.parse(event.data);
      this.emitEvent('order_status_update', data);
    });

    // Product events
    this.eventSource.addEventListener('product_update', (event) => {
      const data = JSON.parse(event.data);
      this.emitEvent('product_update', data);
    });

    // System events
    this.eventSource.addEventListener('system_alert', (event) => {
      const data = JSON.parse(event.data);
      this.emitEvent('system_alert', data);
    });

    // User events
    this.eventSource.addEventListener('user_registration', (event) => {
      const data = JSON.parse(event.data);
      this.emitEvent('user_registration', data);
    });

    // Test events
    this.eventSource.addEventListener('test_event', (event) => {
      const data = JSON.parse(event.data);
      this.emitEvent('test_event', data);
    });
  }

  /**
   * Add event listener
   */
  on(eventType: string, handler: SSEEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event listener
   */
  off(eventType: string, handler: SSEEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to registered handlers
   */
  private emitEvent(eventType: string, data: any): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler({ type: eventType, data });
        } catch (error) {
          console.error(`Error in SSE event handler for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    readyState?: number;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      readyState: this.eventSource?.readyState,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
export const sseClient = new SSEClient();

// React hook for using SSE in components
import { useEffect, useRef, useState } from 'react';

export function useSSE() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const eventHandlersRef = useRef<Map<string, SSEEventHandler[]>>(new Map());

  useEffect(() => {
    // Connection status handlers
    const handleConnection = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
    };

    const handleDisconnection = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    const handleError = () => {
      setIsConnected(false);
      setConnectionStatus('error');
    };

    const handleMaxReconnect = () => {
      setIsConnected(false);
      setConnectionStatus('failed');
    };

    // Register connection handlers
    sseClient.on('connection', handleConnection);
    sseClient.on('disconnection', handleDisconnection);
    sseClient.on('error', handleError);
    sseClient.on('max_reconnect_attempts', handleMaxReconnect);

    // Connect on mount
    sseClient.connect();

    // Cleanup on unmount
    return () => {
      sseClient.off('connection', handleConnection);
      sseClient.off('disconnection', handleDisconnection);
      sseClient.off('error', handleError);
      sseClient.off('max_reconnect_attempts', handleMaxReconnect);
      
      // Don't disconnect here as other components might be using it
      // sseClient.disconnect();
    };
  }, []);

  const addEventListener = (eventType: string, handler: SSEEventHandler) => {
    sseClient.on(eventType, handler);
    
    // Track handlers for cleanup
    if (!eventHandlersRef.current.has(eventType)) {
      eventHandlersRef.current.set(eventType, []);
    }
    eventHandlersRef.current.get(eventType)!.push(handler);
  };

  const removeEventListener = (eventType: string, handler: SSEEventHandler) => {
    sseClient.off(eventType, handler);
    
    // Remove from tracked handlers
    const handlers = eventHandlersRef.current.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  };

  // Cleanup tracked handlers on unmount
  useEffect(() => {
    return () => {
      eventHandlersRef.current.forEach((handlers, eventType) => {
        handlers.forEach(handler => {
          sseClient.off(eventType, handler);
        });
      });
      eventHandlersRef.current.clear();
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    addEventListener,
    removeEventListener,
    connect: sseClient.connect,
    disconnect: sseClient.disconnect,
    reconnect: sseClient.reconnect,
    getStatus: sseClient.getStatus
  };
}

export default sseClient;