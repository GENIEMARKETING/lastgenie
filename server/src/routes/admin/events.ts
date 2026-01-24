import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { adminAuthenticate } from '../../middleware/adminAuth';
import { sseManager, SSEClient } from '../../services/sse';
import { AuthRequest } from '../../middleware/auth';

const router = express.Router();

/**
 * GET /api/admin/events
 * Server-Sent Events endpoint for real-time admin updates
 */
router.get('/', adminAuthenticate, (req: AuthRequest, res) => {
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
  const client: SSEClient = {
    id: uuidv4(),
    userId: req.user!.id,
    role: req.user!.role,
    response: res,
    lastPing: Date.now()
  };

  // Add client to SSE manager
  sseManager.addClient(client);

  // Keep connection alive
  const keepAlive = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (error) {
      clearInterval(keepAlive);
    }
  }, 15000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    sseManager.removeClient(client.id);
  });

  req.on('aborted', () => {
    clearInterval(keepAlive);
    sseManager.removeClient(client.id);
  });
});

/**
 * GET /api/admin/events/stats
 * Get SSE connection statistics
 */
router.get('/stats', adminAuthenticate, (req, res) => {
  try {
    const stats = sseManager.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
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
router.post('/test', adminAuthenticate, (req, res) => {
  try {
    const { message = 'Test message from admin' } = req.body;

    sseManager.broadcastToAdmins({
      type: 'test_event',
      data: {
        message,
        sentBy: req.user!.email,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      message: 'Test event sent to all admin clients'
    });
  } catch (error) {
    console.error('Error sending test event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test event'
    });
  }
});

export default router;