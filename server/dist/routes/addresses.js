"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Validation schemas
const createAddressSchema = zod_1.z.object({
    streetAddress: zod_1.z.string().min(1).max(200),
    city: zod_1.z.string().min(1).max(100),
    state: zod_1.z.string().min(1).max(100),
    zipCode: zod_1.z.string().min(1).max(20),
    country: zod_1.z.string().min(1).max(100),
    type: zod_1.z.enum(['shipping', 'billing']),
    isDefault: zod_1.z.boolean().default(false)
});
const updateAddressSchema = zod_1.z.object({
    streetAddress: zod_1.z.string().min(1).max(200).optional(),
    city: zod_1.z.string().min(1).max(100).optional(),
    state: zod_1.z.string().min(1).max(100).optional(),
    zipCode: zod_1.z.string().min(1).max(20).optional(),
    country: zod_1.z.string().min(1).max(100).optional(),
    type: zod_1.z.enum(['shipping', 'billing']).optional(),
    isDefault: zod_1.z.boolean().optional()
});
/**
 * GET /api/addresses
 * Get user's addresses (requires authentication)
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        const { type } = req.query;
        const where = {
            userId: req.user.id
        };
        if (type === 'shipping' || type === 'billing') {
            where.type = type;
        }
        const addresses = await prisma_1.prisma.address.findMany({
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
    }
    catch (error) {
        console.error('Error fetching addresses:', error);
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
router.post('/', auth_1.authenticate, async (req, res) => {
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
            await prisma_1.prisma.address.updateMany({
                where: {
                    userId: req.user.id,
                    type: validatedData.type
                },
                data: {
                    isDefault: false
                }
            });
        }
        const address = await prisma_1.prisma.address.create({
            data: {
                ...validatedData,
                userId: req.user.id
            }
        });
        res.status(201).json({
            success: true,
            data: address
        });
    }
    catch (error) {
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
router.put('/:id', auth_1.authenticate, async (req, res) => {
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
        const existingAddress = await prisma_1.prisma.address.findFirst({
            where: {
                id,
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
            await prisma_1.prisma.address.updateMany({
                where: {
                    userId: req.user.id,
                    type: addressType,
                    id: { not: id }
                },
                data: {
                    isDefault: false
                }
            });
        }
        const address = await prisma_1.prisma.address.update({
            where: { id },
            data: validatedData
        });
        res.json({
            success: true,
            data: address
        });
    }
    catch (error) {
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
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        const { id } = req.params;
        // Check if address belongs to user
        const existingAddress = await prisma_1.prisma.address.findFirst({
            where: {
                id,
                userId: req.user.id
            }
        });
        if (!existingAddress) {
            return res.status(404).json({
                success: false,
                error: 'Address not found'
            });
        }
        await prisma_1.prisma.address.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Address deleted successfully'
        });
    }
    catch (error) {
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
router.post('/:id/set-default', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        const { id } = req.params;
        // Check if address belongs to user
        const existingAddress = await prisma_1.prisma.address.findFirst({
            where: {
                id,
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
        await prisma_1.prisma.address.updateMany({
            where: {
                userId: req.user.id,
                type: existingAddress.type,
                id: { not: id }
            },
            data: {
                isDefault: false
            }
        });
        // Set this address as default
        const address = await prisma_1.prisma.address.update({
            where: { id },
            data: {
                isDefault: true
            }
        });
        res.json({
            success: true,
            data: address
        });
    }
    catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to set default address'
        });
    }
});
exports.default = router;
