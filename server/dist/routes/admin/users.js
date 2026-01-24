"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const adminAuth_1 = require("../../middleware/adminAuth");
const prisma_1 = require("../../lib/prisma");
const router = express_1.default.Router();
// Validation schemas
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    role: zod_1.z.enum(['customer', 'admin', 'super_admin']),
    password: zod_1.z.string().min(8)
});
const updateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    firstName: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().min(1).optional(),
    role: zod_1.z.enum(['customer', 'admin', 'super_admin']).optional(),
    isActive: zod_1.z.boolean().optional()
});
const promoteUserSchema = zod_1.z.object({
    role: zod_1.z.enum(['admin', 'super_admin'])
});
/**
 * GET /api/admin/users
 * Get all users with pagination and filtering
 */
router.get('/', ...(0, adminAuth_1.requireAdminRead)('users'), async (req, res) => {
    try {
        const { page = '1', limit = '20', search = '', role = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        // Build where clause
        const where = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (role && role !== 'all') {
            where.role = role;
        }
        // Get users with counts
        const [users, totalCount] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isAgeVerified: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            orders: true,
                            reviews: true
                        }
                    }
                },
                orderBy: { [sortBy]: sortOrder },
                take: limitNum,
                skip: offset
            }),
            prisma_1.prisma.user.count({ where })
        ]);
        const totalPages = Math.ceil(totalCount / limitNum);
        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalCount,
                    hasNextPage: pageNum < totalPages,
                    hasPreviousPage: pageNum > 1
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});
/**
 * GET /api/admin/users/stats
 * Get user statistics
 */
router.get('/stats', ...(0, adminAuth_1.requireAdminRead)('users'), async (req, res) => {
    try {
        const [totalUsers, adminUsers, customerUsers, verifiedUsers, recentUsers] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.user.count({ where: { role: { in: ['admin', 'super_admin'] } } }),
            prisma_1.prisma.user.count({ where: { role: 'customer' } }),
            prisma_1.prisma.user.count({ where: { emailVerified: { not: null } } }),
            prisma_1.prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                }
            })
        ]);
        // Calculate verification rate as percentage
        const verificationRate = totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0;
        res.json({
            success: true,
            data: {
                totalUsers,
                adminUsers,
                customerUsers,
                verifiedUsers,
                recentUsers,
                verificationRate
            }
        });
    }
    catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user statistics'
        });
    }
});
/**
 * GET /api/admin/users/:id
 * Get a specific user by ID
 */
router.get('/:id', ...(0, adminAuth_1.requireAdminRead)('users'), async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
            include: {
                orders: {
                    select: {
                        id: true,
                        orderNumber: true,
                        totalAmount: true,
                        status: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                reviews: {
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                        product: {
                            select: {
                                name: true,
                                sku: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                _count: {
                    select: {
                        orders: true,
                        reviews: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user'
        });
    }
});
/**
 * POST /api/admin/users
 * Create a new user
 */
router.post('/', ...(0, adminAuth_1.requireAdminWrite)('users'), async (req, res) => {
    try {
        const validatedData = createUserSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: validatedData.email }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(validatedData.password, 10);
        // Create user
        const user = await prisma_1.prisma.user.create({
            data: {
                email: validatedData.email,
                passwordHash,
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                role: validatedData.role,
                emailVerified: new Date() // Auto-verify admin-created users
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                emailVerified: true,
                createdAt: true
            }
        });
        res.status(201).json({
            success: true,
            data: user
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input data',
                details: error.errors
            });
        }
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user'
        });
    }
});
/**
 * PUT /api/admin/users/:id
 * Update a user
 */
router.put('/:id', ...(0, adminAuth_1.requireAdminWrite)('users'), async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateUserSchema.parse(req.body);
        // Check if user exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        // Check if email is being updated and if it conflicts
        if (validatedData.email && validatedData.email !== existingUser.email) {
            const emailConflict = await prisma_1.prisma.user.findUnique({
                where: { email: validatedData.email }
            });
            if (emailConflict) {
                return res.status(400).json({
                    success: false,
                    error: 'Email is already in use by another user'
                });
            }
        }
        // Update user
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id },
            data: validatedData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json({
            success: true,
            data: updatedUser
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input data',
                details: error.errors
            });
        }
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
});
/**
 * POST /api/admin/users/:id/promote
 * Promote a user to admin or super_admin
 */
router.post('/:id/promote', ...(0, adminAuth_1.requireAdminWrite)('users'), async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = promoteUserSchema.parse(req.body);
        // Check if user exists
        const user = await prisma_1.prisma.user.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        // Update user role
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id },
            data: { role: validatedData.role },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                updatedAt: true
            }
        });
        res.json({
            success: true,
            data: updatedUser,
            message: `User promoted to ${validatedData.role}`
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input data',
                details: error.errors
            });
        }
        console.error('Error promoting user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to promote user'
        });
    }
});
/**
 * DELETE /api/admin/users/:id
 * Delete a user (soft delete by deactivating)
 */
router.delete('/:id', ...(0, adminAuth_1.requireAdminDelete)('users'), async (req, res) => {
    try {
        const { id } = req.params;
        // Check if user exists
        const user = await prisma_1.prisma.user.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        // Prevent deletion of super_admin users
        if (user.role === 'super_admin') {
            return res.status(403).json({
                success: false,
                error: 'Cannot delete super admin users'
            });
        }
        // Soft delete by updating email to mark as deleted
        const deletedUser = await prisma_1.prisma.user.update({
            where: { id },
            data: {
                email: `deleted_${Date.now()}_${user.email}`,
                firstName: 'Deleted',
                lastName: 'User',
                role: 'customer'
            }
        });
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user'
        });
    }
});
exports.default = router;
