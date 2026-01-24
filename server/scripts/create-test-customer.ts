#!/usr/bin/env ts-node

import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/bcrypt';

async function main() {
  try {
    console.log('👤 Creating test customer user...');
    
    const email = 'customer@test.com';
    const password = 'customer123';
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('✅ Test customer user already exists:', email);
      console.log('   Password: customer123');
      console.log('   Role:', existingUser.role);
      return;
    }

    const passwordHash = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Customer',
        lastName: 'Test',
        role: 'customer',
        emailVerified: new Date(),
        isAgeVerified: true
      }
    });

    console.log('✅ Test customer user created successfully!');
    console.log('   Email:', email);
    console.log('   Password: customer123');
    console.log('   Role:', user.role);
    console.log('   ID:', user.id);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();