"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const age_verification_1 = __importDefault(require("../services/age-verification"));
const router = express_1.default.Router();
// Validation schema for age verification
const verifyAgeSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'User ID is required'),
    dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});
// Validation schema for guest age verification
const verifyGuestAgeSchema = zod_1.z.object({
    dateOfBirth: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});
/**
 * POST /api/age-verification/verify
 * Verify user's age using date of birth
 */
router.post('/verify', async (req, res) => {
    try {
        const validatedData = verifyAgeSchema.parse(req.body);
        // Validate date is valid
        const birthDate = new Date(validatedData.dateOfBirth);
        if (isNaN(birthDate.getTime())) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format',
                message: 'Please provide a valid date of birth'
            });
        }
        // Verify age
        const isAgeValid = age_verification_1.default.verifyAge(validatedData.dateOfBirth);
        if (!isAgeValid) {
            return res.status(403).json({
                success: false,
                error: 'Age verification failed',
                message: 'You must be 18 or older to purchase'
            });
        }
        // Update user verification status
        await age_verification_1.default.updateVerificationStatus(validatedData.userId);
        res.json({
            success: true,
            data: {
                verified: true,
                message: 'Age verification successful'
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
        console.error('Age verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify age'
        });
    }
});
/**
 * POST /api/age-verification/verify-guest
 * Verify age for guest users (non-authenticated)
 * Does not update database, only validates age
 */
router.post('/verify-guest', async (req, res) => {
    try {
        const validatedData = verifyGuestAgeSchema.parse(req.body);
        // Validate date is valid
        const birthDate = new Date(validatedData.dateOfBirth);
        if (isNaN(birthDate.getTime())) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format',
                message: 'Please provide a valid date of birth'
            });
        }
        // Verify age
        const isAgeValid = age_verification_1.default.verifyAge(validatedData.dateOfBirth);
        if (!isAgeValid) {
            return res.status(403).json({
                success: false,
                error: 'Age verification failed',
                message: 'You must be 18 or older to purchase'
            });
        }
        // Return success (no database update for guests)
        res.json({
            success: true,
            data: {
                verified: true,
                message: 'Age verification successful'
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
        console.error('Guest age verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify age'
        });
    }
});
/**
 * GET /api/age-verification/status/:userId
 * Get age verification status for user
 */
router.get('/status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }
        const status = await age_verification_1.default.getVerificationStatus(userId);
        res.json({
            success: true,
            data: {
                userId,
                isVerified: status.isVerified,
                verificationDate: status.verificationDate
            }
        });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        console.error('Age verification status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch verification status'
        });
    }
});
exports.default = router;
