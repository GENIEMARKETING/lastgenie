"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const bcrypt_1 = require("../lib/bcrypt");
const jwt_1 = require("../lib/jwt");
const auth_1 = require("../middleware/auth");
const email_1 = require("../services/email");
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
// Validation schemas
const registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters')
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required')
});
const updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required').optional(),
    lastName: zod_1.z.string().min(1, 'Last name is required').optional(),
    email: zod_1.z.string().email('Invalid email format').optional(),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters')
});
/**
 * Helper function to set JWT cookies
 */
function setAuthCookies(res, userId, email) {
    const accessToken = (0, jwt_1.generateAccessToken)({ sub: userId, email });
    const refreshToken = (0, jwt_1.generateRefreshToken)({ sub: userId, email });
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes for access token
    };
    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
    });
}
/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        // Validate request body
        const validatedData = registerSchema.parse(req.body);
        console.log('Registration attempt:', {
            email: validatedData.email,
            firstName: validatedData.firstName,
        });
        // Check if email already exists
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { email: validatedData.email }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email already registered'
            });
        }
        // Hash password
        const passwordHash = await (0, bcrypt_1.hashPassword)(validatedData.password);
        // Generate email verification token
        const emailVerificationToken = crypto_1.default.randomBytes(32).toString('hex');
        const emailVerificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Create user in database
        const user = await prisma_1.prisma.user.create({
            data: {
                email: validatedData.email,
                passwordHash,
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                emailVerificationToken,
                emailVerificationTokenExpiry,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                emailVerified: true,
                isAgeVerified: true,
                createdAt: true,
            }
        });
        console.log('User created successfully:', {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
        });
        // Send verification email
        let verificationUrl;
        try {
            const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
            verificationUrl = `${apiUrl}/api/auth/verify-email?token=${emailVerificationToken}`;
            await (0, email_1.sendVerificationEmail)(user.email, user.firstName || 'User', emailVerificationToken);
        }
        catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails, but log it
        }
        // Log verification URL and token for debugging
        if (process.env.NODE_ENV !== 'production') {
            console.log('Registration - Verification details:', {
                nodeEnv: process.env.NODE_ENV,
                userId: user.id,
                email: user.email,
                verificationToken: emailVerificationToken,
                verificationUrl,
                willIncludeInResponse: process.env.NODE_ENV !== 'production',
            });
        }
        // Don't authenticate user yet - they must verify email first
        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    emailVerified: user.emailVerified,
                    isAgeVerified: user.isAgeVerified,
                    createdAt: user.createdAt,
                },
                // Include verification URL and token when not in production (defaults to showing in dev)
                // This ensures users can verify emails even if NODE_ENV is not explicitly set
                ...(process.env.NODE_ENV !== 'production' && {
                    verificationUrl,
                    verificationToken: emailVerificationToken,
                    devMode: true,
                }),
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.issues
            });
        }
        // Detailed error logging
        console.error('Registration error:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            error: error,
        });
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Registration failed',
            message: 'An error occurred during registration. Please try again.'
        });
    }
});
/**
 * GET /api/auth/verify-email
 * Verify user email using token from email link
 */
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Verification token is required'
            });
        }
        // Find user with matching token
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                emailVerificationToken: token,
                emailVerificationTokenExpiry: {
                    gt: new Date() // Token must not be expired
                }
            }
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification token'
            });
        }
        // Update user: mark email as verified and clear token
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
                emailVerificationToken: null,
                emailVerificationTokenExpiry: null,
            }
        });
        // Now authenticate the user (set cookies)
        setAuthCookies(res, user.id, user.email);
        // Check if this is an API request (JSON response) or browser request (redirect)
        const acceptHeader = req.headers.accept || '';
        if (acceptHeader.includes('application/json')) {
            return res.json({
                success: true,
                message: 'Email verified successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        emailVerified: new Date(),
                        isAgeVerified: user.isAgeVerified,
                    }
                }
            });
        }
        // Redirect to frontend verification success page
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?success=true`);
    }
    catch (error) {
        console.error('Email verification error:', error);
        // Check if this is an API request
        const acceptHeader = req.headers.accept || '';
        if (acceptHeader.includes('application/json')) {
            return res.status(500).json({
                success: false,
                error: 'Verification failed'
            });
        }
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?error=verification_failed`);
    }
});
/**
 * POST /api/auth/manual-verify
 * Manual verification endpoint for development (bypasses email)
 */
router.post('/manual-verify', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Verification token is required'
            });
        }
        // Find user with matching token (allow expired tokens in development)
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                emailVerificationToken: token
            }
        });
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid verification token'
            });
        }
        // Check if already verified
        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                error: 'Email is already verified'
            });
        }
        // Update user: mark email as verified and clear token
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
                emailVerificationToken: null,
                emailVerificationTokenExpiry: null,
            }
        });
        // Now authenticate the user (set cookies)
        setAuthCookies(res, user.id, user.email);
        console.log('Manual verification successful:', {
            userId: user.id,
            email: user.email,
            verifiedAt: updatedUser.emailVerified
        });
        res.json({
            success: true,
            message: 'Email verified successfully',
            data: {
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    firstName: updatedUser.firstName,
                    lastName: updatedUser.lastName,
                    emailVerified: updatedUser.emailVerified,
                    isAgeVerified: updatedUser.isAgeVerified,
                }
            }
        });
    }
    catch (error) {
        console.error('Manual verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification failed'
        });
    }
});
/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        // Validate request body
        const validatedData = loginSchema.parse(req.body);
        // Find user by email
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: validatedData.email }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        // Compare password
        const isPasswordValid = await (0, bcrypt_1.comparePassword)(validatedData.password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        // Check if email is verified
        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                error: 'Email not verified',
                message: 'Please verify your email before logging in. Check your inbox for the verification link.'
            });
        }
        // Generate JWT tokens and set cookies
        setAuthCookies(res, user.id, user.email);
        // Return user data (without password hash)
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    emailVerified: user.emailVerified,
                    isAgeVerified: user.isAgeVerified,
                }
            }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
});
/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', (req, res) => {
    try {
        // Clear JWT cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.json({
            success: true,
            message: 'Logout successful'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed'
        });
    }
});
/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }
        // Find user by email
        const user = await prisma_1.prisma.user.findUnique({
            where: { email }
        });
        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }
        // Generate reset token
        const passwordResetToken = crypto_1.default.randomBytes(32).toString('hex');
        const passwordResetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        // Update user with reset token
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken,
                passwordResetTokenExpiry,
            }
        });
        // TODO: Send reset email
        // For now, we'll just log the token (in production, send email)
        console.log('Password reset token:', passwordResetToken);
        res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        });
    }
    catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            error: 'Password reset request failed'
        });
    }
});
/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                emailVerified: true,
                isAgeVerified: true,
                createdAt: true,
                updatedAt: true,
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
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile'
        });
    }
});
/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        const validatedData = updateProfileSchema.parse(req.body);
        // Check if email is being changed and if it's already taken
        if (validatedData.email && validatedData.email !== req.user.email) {
            const existingUser = await prisma_1.prisma.user.findUnique({
                where: { email: validatedData.email }
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Email already registered'
                });
            }
        }
        // Update user
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(validatedData.firstName && { firstName: validatedData.firstName }),
                ...(validatedData.lastName && { lastName: validatedData.lastName }),
                ...(validatedData.email && {
                    email: validatedData.email,
                    emailVerified: null, // Require re-verification if email changed
                }),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                emailVerified: true,
                isAgeVerified: true,
                updatedAt: true,
            }
        });
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile'
        });
    }
});
/**
 * PUT /api/auth/password
 * Change user password
 */
router.put('/password', auth_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        const validatedData = changePasswordSchema.parse(req.body);
        // Get user with password hash
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        // Verify current password
        const isCurrentPasswordValid = await (0, bcrypt_1.comparePassword)(validatedData.currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }
        // Hash new password
        const newPasswordHash = await (0, bcrypt_1.hashPassword)(validatedData.newPassword);
        // Update password
        await prisma_1.prisma.user.update({
            where: { id: req.user.id },
            data: {
                passwordHash: newPasswordHash
            }
        });
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: error.issues
            });
        }
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password'
        });
    }
});
exports.default = router;
