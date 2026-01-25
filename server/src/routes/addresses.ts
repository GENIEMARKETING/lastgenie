import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const createAddressSchema = z.object({
  streetAddress: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zipCode: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
  phone: z.string().optional(),
  type: z.enum(['shipping', 'billing']),
  isDefault: z.boolean().default(false)
});

const updateAddressSchema = z.object({
  streetAddress: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  zipCode: z.string().min(1).max(20).optional(),
  country: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  type: z.enum(['shipping', 'billing']).optional(),
  isDefault: z.boolean().optional()
});

/**
 * GET /api/addresses
 * Get user's addresses (requires authentication)
 */
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { type } = req.query;
    
    const where: any = {
      userId: req.user.id
    };
    
    if (type === 'shipping' || type === 'billing') {
      where.type = type;
    }
    
    const addresses = await prisma.address.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('❌ Error fetching addresses:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.id,
      userEmail: req.user?.email,
      queryType: req.query.type,
      requestPath: req.path,
      requestMethod: req.method,
      timestamp: new Date().toISOString(),
      fullError: error
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch addresses'
    });
  }
});

/**
 * POST /api/addresses
 * Create new address (requires authentication)
 */
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const validatedData = createAddressSchema.parse(req.body);
    
    // If this is being set as default, unset other default addresses of the same type
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: req.user.id,
          type: validatedData.type
        },
        data: {
          isDefault: false
        }
      });
    }
    
    const address = await prisma.address.create({
      data: {
        ...validatedData,
        userId: req.user.id
      }
    });
    
    res.status(201).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create address'
    });
  }
});

/**
 * PUT /api/addresses/:id
 * Update address (requires authentication)
 */
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    const validatedData = updateAddressSchema.parse(req.body);
    
    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: id as string,
        userId: req.user.id
      }
    });
    
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }
    
    // If this is being set as default, unset other default addresses of the same type
    if (validatedData.isDefault) {
      const addressType = validatedData.type || existingAddress.type;
      await prisma.address.updateMany({
        where: {
          userId: req.user.id,
          type: addressType,
          id: { not: id as string }
        },
        data: {
          isDefault: false
        }
      });
    }
    
    const address = await prisma.address.update({
      where: { id: id as string },
      data: validatedData
    });
    
    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update address'
    });
  }
});

/**
 * DELETE /api/addresses/:id
 * Delete address (requires authentication)
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    
    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: id as string,
        userId: req.user.id
      }
    });
    
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }
    
    await prisma.address.delete({
      where: { id: id as string }
    });
    
    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete address'
    });
  }
});

/**
 * POST /api/addresses/:id/set-default
 * Set address as default (requires authentication)
 */
router.post('/:id/set-default', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { id } = req.params;
    
    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: id as string,
        userId: req.user.id
      }
    });
    
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Address not found'
      });
    }
    
    // Unset other default addresses of the same type
    await prisma.address.updateMany({
      where: {
        userId: req.user.id,
        type: existingAddress.type,
        id: { not: id as string }
      },
      data: {
        isDefault: false
      }
    });
    
    // Set this address as default
    const address = await prisma.address.update({
      where: { id: id as string },
      data: {
        isDefault: true
      }
    });
    
    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set default address'
    });
  }
});

export default router;