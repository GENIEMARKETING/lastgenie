/**
 * Production-optimized seed script for PostgreSQL
 * Runs with plain Node.js - no TypeScript compilation required
 * Memory-efficient for low-RAM instances (512MB)
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('Seed - Database configuration:', {
  hasUrl: true,
  urlPrefix: process.env.DATABASE_URL.substring(0, 25) + '...',
  databaseType: 'PostgreSQL',
});

// Create PostgreSQL Prisma client
console.log('Using PostgreSQL adapter...');
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

// Enums must match Prisma schema
const ProductCategory = {
  male: 'male',
  female: 'female',
};

const PackageSize = {
  single: 'single',
  twelve_pack: 'twelve_pack',
};

const UserRole = {
  customer: 'customer',
  admin: 'admin',
  super_admin: 'super_admin',
};

async function main() {
  console.log('Starting database seeding...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.stockMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Seed products
  console.log('Creating products...');

  const products = [
    {
      sku: 'genie-for-him',
      name: 'Genie for Him',
      description: 'Boost Your Confidence & Vitality. A specially formulated drink designed to support male vitality and confidence.',
      price: 10.00,
      imageUrl: '/images/products/genie-for-him/genie-for-him-1.webp',
      category: ProductCategory.male,
      packageSize: PackageSize.single,
      isSubscribable: true,
    },
    {
      sku: 'genie-for-her',
      name: 'Genie for Her',
      description: 'Enhance Your Confidence & Wellness. A specially formulated drink designed to support female vitality and confidence.',
      price: 10.00,
      imageUrl: '/images/products/genie-for-her/genie-for-her-1.webp',
      category: ProductCategory.female,
      packageSize: PackageSize.single,
      isSubscribable: true,
    },
    {
      sku: 'genie-for-him-12pack',
      name: 'Genie for Him - 12 Pack',
      description: 'Boost Your Confidence & Vitality - 12 Pack. Stock up and save with our 12-pack of Genie for Him.',
      price: 99.00,
      imageUrl: '/images/products/genie-for-him/genie-for-him-1.webp',
      category: ProductCategory.male,
      packageSize: PackageSize.twelve_pack,
      isSubscribable: true,
    },
    {
      sku: 'genie-for-her-12pack',
      name: 'Genie for Her - 12 Pack',
      description: 'Enhance Your Confidence & Wellness - 12 Pack. Stock up and save with our 12-pack of Genie for Her.',
      price: 99.00,
      imageUrl: '/images/products/genie-for-her/genie-for-her-1.webp',
      category: ProductCategory.female,
      packageSize: PackageSize.twelve_pack,
      isSubscribable: true,
    },
  ];

  const createdProducts = [];
  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData,
    });
    createdProducts.push(product);
    console.log(`Created product: ${product.name} (SKU: ${product.sku})`);
  }

  // Create admin users
  console.log('Creating admin users...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@lastgenie.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.admin,
      emailVerified: new Date(),
    },
  });
  console.log(`Created admin user: ${adminUser.email}`);

  const superAdminUser = await prisma.user.create({
    data: {
      email: 'superadmin@lastgenie.com',
      passwordHash: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.super_admin,
      emailVerified: new Date(),
    },
  });
  console.log(`Created super admin user: ${superAdminUser.email}`);

  // Create inventory records
  console.log('Creating inventory records...');

  const inventoryData = [
    { sku: 'genie-for-him', stock: 100, threshold: 10 },
    { sku: 'genie-for-her', stock: 100, threshold: 10 },
    { sku: 'genie-for-him-12pack', stock: 50, threshold: 5 },
    { sku: 'genie-for-her-12pack', stock: 50, threshold: 5 },
  ];

  for (const product of createdProducts) {
    const inventoryInfo = inventoryData.find(inv => inv.sku === product.sku);
    if (inventoryInfo) {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          currentStock: inventoryInfo.stock,
          reservedStock: 0,
          lowStockThreshold: inventoryInfo.threshold,
          lastRestocked: new Date(),
          totalReceived: inventoryInfo.stock,
          totalSold: 0,
        },
      });

      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'restock',
          quantity: inventoryInfo.stock,
          previousStock: 0,
          newStock: inventoryInfo.stock,
          reason: 'Initial inventory setup',
          adminUserId: adminUser.id,
          metadata: {
            source: 'seed_script',
            initialSetup: true,
          },
        },
      });

      console.log(`Created inventory for ${product.name}: ${inventoryInfo.stock} units`);
    }
  }

  console.log('\n=== Database seeding completed successfully! ===');
  console.log('\nProduct SKUs available:');
  console.log('  - genie-for-him: Genie for Him ($10) - 100 units');
  console.log('  - genie-for-her: Genie for Her ($10) - 100 units');
  console.log('  - genie-for-him-12pack: Genie for Him 12-Pack ($99) - 50 units');
  console.log('  - genie-for-her-12pack: Genie for Her 12-Pack ($99) - 50 units');
  console.log('\nAdmin users created:');
  console.log('  - admin@lastgenie.com (password: admin123)');
  console.log('  - superadmin@lastgenie.com (password: superadmin123)');
}

async function runSeed() {
  try {
    await main();
  } catch (e) {
    console.error('Error seeding database:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSeed();
