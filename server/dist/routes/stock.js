"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../lib/prisma");
const router = express_1.default.Router();
/**
 * GET /api/stock/:sku
 * Get stock information for a product by SKU (public endpoint)
 */
router.get('/:sku', async (req, res) => {
    try {
        const { sku } = req.params;
        const product = await prisma_1.prisma.product.findUnique({
            where: { sku },
            include: {
                inventory: true
            }
        });
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        // Only return stock info for active products
        if (!product.isActive) {
            return res.json({
                success: true,
                data: {
                    currentStock: 0,
                    lowStockThreshold: 0,
                    isAvailable: false
                }
            });
        }
        const inventory = product.inventory;
        const currentStock = inventory?.currentStock || 0;
        const lowStockThreshold = inventory?.lowStockThreshold || 10;
        res.json({
            success: true,
            data: {
                currentStock,
                lowStockThreshold,
                isAvailable: currentStock > 0
            }
        });
    }
    catch (error) {
        console.error('Error fetching stock info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stock information'
        });
    }
});
/**
 * GET /api/stock/check-availability
 * Check availability for multiple products
 */
router.post('/check-availability', async (req, res) => {
    try {
        const { skus } = req.body;
        if (!Array.isArray(skus)) {
            return res.status(400).json({
                success: false,
                error: 'SKUs must be an array'
            });
        }
        const products = await prisma_1.prisma.product.findMany({
            where: {
                sku: { in: skus },
                isActive: true
            },
            include: {
                inventory: true
            }
        });
        const availability = products.map(product => {
            const inventory = product.inventory;
            const currentStock = inventory?.currentStock || 0;
            const lowStockThreshold = inventory?.lowStockThreshold || 10;
            return {
                sku: product.sku,
                productId: product.id,
                name: product.name,
                currentStock,
                lowStockThreshold,
                isAvailable: currentStock > 0,
                isLowStock: currentStock <= lowStockThreshold && currentStock > 0
            };
        });
        res.json({
            success: true,
            data: availability
        });
    }
    catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check availability'
        });
    }
});
exports.default = router;
