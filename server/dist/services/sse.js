"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSEEvents = exports.sseManager = void 0;
class SSEManager {
    constructor() {
        this.clients = new Map();
        // Ping clients every 30 seconds to keep connections alive
        this.pingInterval = setInterval(() => {
            this.pingClients();
        }, 30000);
    }
    /**
     * Add a new SSE client
     */
    addClient(client) {
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
    removeClient(clientId) {
        const client = this.clients.get(clientId);
        if (client) {
            try {
                client.response.end();
            }
            catch (error) {
                // Client might already be disconnected
            }
            this.clients.delete(clientId);
            console.log(`SSE client disconnected: ${clientId}, Total clients: ${this.clients.size}`);
        }
    }
    /**
     * Send event to a specific client
     */
    sendToClient(clientId, event) {
        const client = this.clients.get(clientId);
        if (!client) {
            return false;
        }
        try {
            const sseData = this.formatSSEData(event);
            client.response.write(sseData);
            client.lastPing = Date.now();
            return true;
        }
        catch (error) {
            console.error(`Error sending SSE event to client ${clientId}:`, error);
            this.removeClient(clientId);
            return false;
        }
    }
    /**
     * Broadcast event to all clients
     */
    broadcast(event) {
        const sseData = this.formatSSEData(event);
        const disconnectedClients = [];
        this.clients.forEach((client, clientId) => {
            try {
                client.response.write(sseData);
                client.lastPing = Date.now();
            }
            catch (error) {
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
    broadcastToAdmins(event) {
        const sseData = this.formatSSEData(event);
        const disconnectedClients = [];
        let adminClientCount = 0;
        this.clients.forEach((client, clientId) => {
            if (client.role === 'admin' || client.role === 'super_admin') {
                try {
                    client.response.write(sseData);
                    client.lastPing = Date.now();
                    adminClientCount++;
                }
                catch (error) {
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
    broadcastToUser(userId, event) {
        const sseData = this.formatSSEData(event);
        const disconnectedClients = [];
        let sentCount = 0;
        this.clients.forEach((client, clientId) => {
            if (client.userId === userId) {
                try {
                    client.response.write(sseData);
                    client.lastPing = Date.now();
                    sentCount++;
                }
                catch (error) {
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
    getStats() {
        let adminClients = 0;
        let userClients = 0;
        this.clients.forEach(client => {
            if (client.role === 'admin' || client.role === 'super_admin') {
                adminClients++;
            }
            else {
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
    formatSSEData(event) {
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
    pingClients() {
        const now = Date.now();
        const staleClients = [];
        this.clients.forEach((client, clientId) => {
            // Remove clients that haven't been pinged in 2 minutes
            if (now - client.lastPing > 120000) {
                staleClients.push(clientId);
                return;
            }
            try {
                client.response.write(': ping\n\n');
                client.lastPing = now;
            }
            catch (error) {
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
    cleanup() {
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
exports.sseManager = new SSEManager();
// Event helper functions
exports.SSEEvents = {
    // Inventory events
    inventoryUpdate: (productId, currentStock, lowStock) => ({
        type: 'inventory_update',
        data: {
            productId,
            currentStock,
            lowStock,
            timestamp: new Date().toISOString()
        }
    }),
    lowStockAlert: (productId, productName, currentStock, threshold) => ({
        type: 'low_stock_alert',
        data: {
            productId,
            productName,
            currentStock,
            threshold,
            timestamp: new Date().toISOString()
        }
    }),
    stockRestock: (productId, productName, addedQuantity, newStock) => ({
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
    newOrder: (orderId, orderNumber, totalAmount, customerEmail) => ({
        type: 'new_order',
        data: {
            orderId,
            orderNumber,
            totalAmount,
            customerEmail,
            timestamp: new Date().toISOString()
        }
    }),
    orderStatusUpdate: (orderId, orderNumber, oldStatus, newStatus) => ({
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
    productUpdate: (productId, productName, changes) => ({
        type: 'product_update',
        data: {
            productId,
            productName,
            changes,
            timestamp: new Date().toISOString()
        }
    }),
    // System events
    systemAlert: (level, message, details) => ({
        type: 'system_alert',
        data: {
            level,
            message,
            details,
            timestamp: new Date().toISOString()
        }
    }),
    // User events
    userRegistration: (userId, userEmail) => ({
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
    exports.sseManager.cleanup();
    process.exit(0);
});
process.on('SIGTERM', () => {
    exports.sseManager.cleanup();
    process.exit(0);
});
