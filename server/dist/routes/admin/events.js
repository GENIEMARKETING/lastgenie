"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const adminAuth_1 = require("../../middleware/adminAuth");
const sse_1 = require("../../services/sse");
const router = express_1.default.Router();
/**
 * GET /api/admin/events
 * Server-Sent Events endpoint for real-time admin updates
 */
router.get('/', adminAuth_1.adminAuthenticate, (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'Access-Control-Allow-Credentials': 'true'
    });
    // Create client
    const client = {
        id: (0, uuid_1.v4)(),
        userId: req.user.id,
        role: req.user.role,
        response: res,
        lastPing: Date.now()
    };
    // Add client to SSE manager
    sse_1.sseManager.addClient(client);
    // Keep connection alive
    const keepAlive = setInterval(() => {
        try {
            res.write(': heartbeat\n\n');
        }
        catch (error) {
            clearInterval(keepAlive);
        }
    }, 15000);
    // Handle client disconnect
    req.on('close', () => {
        clearInterval(keepAlive);
        sse_1.sseManager.removeClient(client.id);
    });
    req.on('aborted', () => {
        clearInterval(keepAlive);
        sse_1.sseManager.removeClient(client.id);
    });
});
/**
 * GET /api/admin/events/stats
 * Get SSE connection statistics
 */
router.get('/stats', adminAuth_1.adminAuthenticate, (req, res) => {
    try {
        const stats = sse_1.sseManager.getStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error fetching SSE stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch SSE statistics'
        });
    }
});
/**
 * POST /api/admin/events/test
 * Send a test event to all admin clients
 */
router.post('/test', adminAuth_1.adminAuthenticate, (req, res) => {
    try {
        const { message = 'Test message from admin' } = req.body;
        sse_1.sseManager.broadcastToAdmins({
            type: 'test_event',
            data: {
                message,
                sentBy: req.user.email,
                timestamp: new Date().toISOString()
            }
        });
        res.json({
            success: true,
            message: 'Test event sent to all admin clients'
        });
    }
    catch (error) {
        console.error('Error sending test event:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send test event'
        });
    }
});
exports.default = router;
