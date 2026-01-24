"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = express_1.default.Router();
/**
 * GET /api/orders
 * Fetch all orders for authenticated user
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }
        const orders = await prisma_1.prisma.order.findMany({
            where: {
                userId: req.user.id,
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                imageUrl: true,
                                price: true,
                            },
                        },
                    },
                },
                shippingAddress: {
                    select: {
                        streetAddress: true,
                        city: true,
                        state: true,
                        zipCode: true,
                        country: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json({
            success: true,
            data: orders,
        });
    }
    catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders',
        });
    }
});
exports.default = router;
