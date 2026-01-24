#!/usr/bin/env ts-node

import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    console.log('📋 Users in Database:');
    console.log('====================');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        isAgeVerified: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log('No users found');
      return;
    }

    users.forEach((user, index) => {
      const name = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : 'No name';
      const verified = user.emailVerified ? '✅' : '❌';
      const roleIcon = user.role === 'customer' ? '👤' : 
                      user.role === 'admin' ? '🔧' : '⚡';
      
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${name}`);
      console.log(`   Role: ${roleIcon} ${user.role}`);
      console.log(`   Email Verified: ${verified}`);
      console.log(`   Age Verified: ${user.isAgeVerified ? '✅' : '❌'}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();