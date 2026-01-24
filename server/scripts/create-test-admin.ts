#!/usr/bin/env ts-node

import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/bcrypt';

async function main() {
  try {
    console.log('🔧 Creating test admin user...');
    
    const email = 'admin@test.com';
    const password = 'admin123';
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('✅ Test admin user already exists:', email);
      console.log('   Password: admin123');
      console.log('   Role:', existingUser.role);
      return;
    }

    const passwordHash = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Admin',
        lastName: 'Test',
        role: 'admin',
        emailVerified: new Date(),
        isAgeVerified: true
      }
    });

    console.log('✅ Test admin user created successfully!');
    console.log('   Email:', email);
    console.log('   Password: admin123');
    console.log('   Role:', user.role);
    console.log('   ID:', user.id);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();