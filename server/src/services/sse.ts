import { Response } from 'express';

export interface SSEClient {
  id: string;
  userId?: string;
  role?: string;
  response: Response;
  lastPing: number;
}

export interface SSEEvent {
  type: string;
  data: any;
  id?: string;
  retry?: number;
}

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private pingInterval: NodeJS.Timeout;

  constructor() {
    // Ping clients every 30 seconds to keep connections alive
    this.pingInterval = setInterval(() => {
      this.pingClients();
    }, 30000);
  }

  /**
   * Add a new SSE client
   */
  addClient(client: SSEClient): void {
    this.clients.set(client.id, client);
    console.log(`SSE client connected: ${client.id}, Total clients: ${this.clients.size}`);

    // Send initial connection event
    this.sendToClient(client.id, {
      type: 'connection',
      data: { 
        message: 'Connected to admin events stream',
        clientId: client.id,
        timestamp: new Date().toISOString()
      }
    });

    // Handle client disconnect
    client.response.on('close', () => {
      this.removeClient(client.id);
    });

    client.response.on('error', (error) => {
      console.error(`SSE client error for ${client.id}:`, error);
      this.removeClient(client.id);
    });
  }

  /**
   * Remove an SSE client
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.response.end();
      } catch (error) {
        // Client might already be disconnected
      }
      this.clients.delete(clientId);
      console.log(`SSE client disconnected: ${clientId}, Total clients: ${this.clients.size}`);
    }
  }

  /**
   * Send event to a specific client
   */
  sendToClient(clientId: string, event: SSEEvent): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    try {
      const sseData = this.formatSSEData(event);
      client.response.write(sseData);
      client.lastPing = Date.now();
      return true;
    } catch (error) {
      console.error(`Error sending SSE event to client ${clientId}:`, error);
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Broadcast event to all clients
   */
  broadcast(event: SSEEvent): void {
    const sseData = this.formatSSEData(event);
    const disconnectedClients: string[] = [];

    this.clients.forEach((client, clientId) => {
      try {
        client.response.write(sseData);
        client.lastPing = Date.now();
      } catch (error) {
        console.error(`Error broadcasting to client ${clientId}:`, error);
        disconnectedClients.push(clientId);
      }
    });

    // Clean up disconnected clients
    disconnectedClients.forEach(clientId => {
      this.removeClient(clientId);
    });

    console.log(`Broadcasted event '${event.type}' to ${this.clients.size} clients`);
  }

  /**
   * Broadcast event to admin clients only
   */
  broadcastToAdmins(event: SSEEvent): void {
    const sseData = this.formatSSEData(event);
    const disconnectedClients: string[] = [];
    let adminClientCount = 0;

    this.clients.forEach((client, clientId) => {
      if (client.role === 'admin' || client.role === 'super_admin') {
        try {
          client.response.write(sseData);
          client.lastPing = Date.now();
          adminClientCount++;
        } catch (error) {
          console.error(`Error broadcasting to admin client ${clientId}:`, error);
          disconnectedClients.push(clientId);
        }
      }
    });

    // Clean up disconnected clients
    disconnectedClients.forEach(clientId => {
      this.removeClient(clientId);
    });

    console.log(`Broadcasted admin event '${event.type}' to ${adminClientCount} admin clients`);
  }

  /**
   * Broadcast event to specific user
   */
  broadcastToUser(userId: string, event: SSEEvent): void {
    const sseData = this.formatSSEData(event);
    const disconnectedClients: string[] = [];
    let sentCount = 0;

    this.clients.forEach((client, clientId) => {
      if (client.userId === userId) {
        try {
          client.response.write(sseData);
          client.lastPing = Date.now();
          sentCount++;
        } catch (error) {
          console.error(`Error sending to user client ${clientId}:`, error);
          disconnectedClients.push(clientId);
        }
      }
    });

    // Clean up disconnected clients
    disconnectedClients.forEach(clientId => {
      this.removeClient(clientId);
    });

    if (sentCount > 0) {
      console.log(`Sent event '${event.type}' to user ${userId} (${sentCount} clients)`);
    }
  }

  /**
   * Get client statistics
   */
  getStats(): { totalClients: number; adminClients: number; userClients: number } {
    let adminClients = 0;
    let userClients = 0;

    this.clients.forEach(client => {
      if (client.role === 'admin' || client.role === 'super_admin') {
        adminClients++;
      } else {
        userClients++;
      }
    });

    return {
      totalClients: this.clients.size,
      adminClients,
      userClients
    };
  }

  /**
   * Format event data for SSE
   */
  private formatSSEData(event: SSEEvent): string {
    let sseData = '';
    
    if (event.id) {
      sseData += `id: ${event.id}\n`;
    }
    
    sseData += `event: ${event.type}\n`;
    sseData += `data: ${JSON.stringify(event.data)}\n`;
    
    if (event.retry) {
      sseData += `retry: ${event.retry}\n`;
    }
    
    sseData += '\n';
    return sseData;
  }

  /**
   * Ping all clients to keep connections alive
   */
  private pingClients(): void {
    const now = Date.now();
    const staleClients: string[] = [];

    this.clients.forEach((client, clientId) => {
      // Remove clients that haven't been pinged in 2 minutes
      if (now - client.lastPing > 120000) {
        staleClients.push(clientId);
        return;
      }

      try {
        client.response.write(': ping\n\n');
        client.lastPing = now;
      } catch (error) {
        staleClients.push(clientId);
      }
    });

    // Clean up stale clients
    staleClients.forEach(clientId => {
      this.removeClient(clientId);
    });

    if (staleClients.length > 0) {
      console.log(`Removed ${staleClients.length} stale SSE clients`);
    }
  }

  /**
   * Cleanup when shutting down
   */
  cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.clients.forEach((client, clientId) => {
      this.removeClient(clientId);
    });

    console.log('SSE Manager cleaned up');
  }
}

// Create singleton instance
export const sseManager = new SSEManager();

// Event helper functions
export const SSEEvents = {
  // Inventory events
  inventoryUpdate: (productId: string, currentStock: number, lowStock: boolean) => ({
    type: 'inventory_update',
    data: {
      productId,
      currentStock,
      lowStock,
      timestamp: new Date().toISOString()
    }
  }),

  lowStockAlert: (productId: string, productName: string, currentStock: number, threshold: number) => ({
    type: 'low_stock_alert',
    data: {
      productId,
      productName,
      currentStock,
      threshold,
      timestamp: new Date().toISOString()
    }
  }),

  stockRestock: (productId: string, productName: string, addedQuantity: number, newStock: number) => ({
    type: 'stock_restock',
    data: {
      productId,
      productName,
      addedQuantity,
      newStock,
      timestamp: new Date().toISOString()
    }
  }),

  // Order events
  newOrder: (orderId: string, orderNumber: string, totalAmount: number, customerEmail: string) => ({
    type: 'new_order',
    data: {
      orderId,
      orderNumber,
      totalAmount,
      customerEmail,
      timestamp: new Date().toISOString()
    }
  }),

  orderStatusUpdate: (orderId: string, orderNumber: string, oldStatus: string, newStatus: string) => ({
    type: 'order_status_update',
    data: {
      orderId,
      orderNumber,
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString()
    }
  }),

  // Product events
  productUpdate: (productId: string, productName: string, changes: any) => ({
    type: 'product_update',
    data: {
      productId,
      productName,
      changes,
      timestamp: new Date().toISOString()
    }
  }),

  // System events
  systemAlert: (level: 'info' | 'warning' | 'error', message: string, details?: any) => ({
    type: 'system_alert',
    data: {
      level,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  }),

  // User events
  userRegistration: (userId: string, userEmail: string) => ({
    type: 'user_registration',
    data: {
      userId,
      userEmail,
      timestamp: new Date().toISOString()
    }
  })
};

// Graceful shutdown
process.on('SIGINT', () => {
  sseManager.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  sseManager.cleanup();
  process.exit(0);
});