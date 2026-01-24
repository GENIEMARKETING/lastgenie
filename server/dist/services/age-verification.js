"use strict";
/**
 * Age Verification Service
 *
 * Simple date-of-birth based age verification
 * Verifies users are 18+ years old
 */
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../lib/prisma");
class AgeVerificationService {
    constructor() {
        this.minimumAge = parseInt(process.env.MINIMUM_AGE || '18', 10);
    }
    /**
     * Verify if a date of birth indicates the user is old enough
     * @param dateOfBirth - Date string in YYYY-MM-DD format
     * @returns true if user is 18+ years old
     */
    verifyAge(dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        // Validate date is in the past
        if (birthDate > today) {
            return false;
        }
        // Validate date is reasonable (not more than 150 years ago)
        const maxAge = 150;
        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - maxAge);
        if (birthDate < minDate) {
            return false;
        }
        // Calculate age
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        // Adjust age if birthday hasn't occurred this year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            return age - 1 >= this.minimumAge;
        }
        return age >= this.minimumAge;
    }
    /**
     * Update user's age verification status in database
     * @param userId - User ID
     * @returns Updated user record
     */
    async updateVerificationStatus(userId) {
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                isAgeVerified: true,
                ageVerificationTimestamp: new Date(),
            },
        });
    }
    /**
     * Get user's age verification status
     * @param userId - User ID
     * @returns Verification status and timestamp
     */
    async getVerificationStatus(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                isAgeVerified: true,
                ageVerificationTimestamp: true,
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        return {
            isVerified: user.isAgeVerified,
            verificationDate: user.ageVerificationTimestamp,
        };
    }
}
exports.default = new AgeVerificationService();
