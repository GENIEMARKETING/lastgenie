"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const router = express_1.default.Router();
// Validation schema
const contactSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    email: zod_1.z.string().email('Invalid email format'),
    subject: zod_1.z.string().min(1, 'Subject is required'),
    message: zod_1.z.string().min(10, 'Message must be at least 10 characters'),
});
/**
 * POST /api/contact
 * Submit contact form
 */
router.post('/', async (req, res) => {
    try {
        // Validate request body
        const validatedData = contactSchema.parse(req.body);
        // Store contact submission in database
        const submission = await prisma_1.prisma.contactSubmission.create({
            data: {
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                email: validatedData.email,
                subject: validatedData.subject,
                message: validatedData.message,
            },
        });
        // TODO: Send email notification to support team
        // For now, we'll just log the submission
        console.log('Contact form submission:', {
            id: submission.id,
            email: submission.email,
            subject: submission.subject,
        });
        res.status(201).json({
            success: true,
            message: 'Thank you for contacting us. We will get back to you soon.',
            data: {
                id: submission.id,
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
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit contact form'
        });
    }
});
exports.default = router;
