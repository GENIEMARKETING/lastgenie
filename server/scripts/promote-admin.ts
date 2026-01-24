#!/usr/bin/env ts-node

/**
 * Admin Promotion Script
 * 
 * This script allows you to:
 * 1. List all users in the database
 * 2. Promote a user to admin or super_admin role
 * 
 * Usage:
 *   npm run promote-admin
 *   npm run promote-admin <email> <role>
 */

import { prisma } from '../src/lib/prisma';
import * as readline from 'readline';

interface UserWithStats {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  emailVerified: Date | null;
  createdAt: Date;
  _count: {
    orders: number;
    affiliate?: number;
  };
}

async function listUsers(): Promise<UserWithStats[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return users;
}

async function promoteUser(email: string, targetRole: 'admin' | 'super_admin'): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true
    }
  });

  if (!user) {
    throw new Error(`User with email ${email} not found`);
  }

  if (user.role === targetRole) {
    console.log(`✅ User ${email} already has ${targetRole} role`);
    return;
  }

  const oldRole = user.role;
  
  await prisma.user.update({
    where: { email },
    data: { role: targetRole }
  });

  // Log the promotion
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'user_promoted_via_script',
      entity: 'user',
      entityId: user.id,
      oldValues: { role: oldRole },
      newValues: { role: targetRole },
      metadata: {
        promotedBy: 'system_script',
        reason: 'Admin promotion via script'
      },
      ipAddress: 'localhost',
      userAgent: 'promotion_script'
    }
  });

  console.log(`✅ Successfully promoted ${email} from ${oldRole} to ${targetRole}`);
}

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

async function interactivePromotion(): Promise<void> {
  const rl = createReadlineInterface();
  
  try {
    console.log('\n📋 Current Users in Database:');
    console.log('================================');
    
    const users = await listUsers();
    
    if (users.length === 0) {
      console.log('No users found in database');
      return;
    }

    users.forEach((user, index) => {
      const name = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : 'No name';
      const verified = user.emailVerified ? '✅' : '❌';
      const roleDisplay = user.role === 'customer' ? '👤' : 
                         user.role === 'admin' ? '🔧' : '⚡';
      
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${name}`);
      console.log(`   Role: ${roleDisplay} ${user.role}`);
      console.log(`   Verified: ${verified}`);
      console.log(`   Orders: ${user._count.orders}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    // Ask for email to promote
    const email = await new Promise<string>((resolve) => {
      rl.question('\n📧 Enter email address to promote to admin: ', resolve);
    });

    if (!email.trim()) {
      console.log('❌ Email address is required');
      return;
    }

    // Ask for target role
    const roleChoice = await new Promise<string>((resolve) => {
      rl.question('🔧 Choose role (1 for admin, 2 for super_admin): ', resolve);
    });

    const targetRole = roleChoice.trim() === '2' ? 'super_admin' : 'admin';

    // Confirm promotion
    const confirm = await new Promise<string>((resolve) => {
      rl.question(`\n⚠️  Confirm: Promote ${email} to ${targetRole}? (y/N): `, resolve);
    });

    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Promotion cancelled');
      return;
    }

    await promoteUser(email, targetRole);
    
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  try {
    console.log('🚀 Admin Promotion Script');
    console.log('========================');

    const args = process.argv.slice(2);
    
    if (args.length >= 2) {
      // Direct promotion with command line arguments
      const [email, role] = args;
      
      if (!['admin', 'super_admin'].includes(role)) {
        console.error('❌ Invalid role. Use "admin" or "super_admin"');
        process.exit(1);
      }
      
      await promoteUser(email, role as 'admin' | 'super_admin');
    } else {
      // Interactive mode
      await interactivePromotion();
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { promoteUser, listUsers };