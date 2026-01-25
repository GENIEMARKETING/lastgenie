import { PrismaClient, ProductCategory, PackageSize, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Database-agnostic connection setup
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

// Ensure DATABASE_URL is set in environment for Prisma's internal use
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

// Detect database type from DATABASE_URL
const isPostgreSQL = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');

console.log('Seed - Database configuration:', {
  originalUrl: databaseUrl,
  databaseType: isPostgreSQL ? 'PostgreSQL' : 'SQLite',
});

// Create database-specific Prisma client
async function createPrismaClient(): Promise<PrismaClient> {
  if (isPostgreSQL) {
    // PostgreSQL configuration (production)
    console.log('🐘 Using PostgreSQL adapter...');
    const { PrismaPg } = await import('@prisma/adapter-pg');
    
    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });

    return new PrismaClient({
      adapter,
      log: ['query', 'error', 'warn'],
    });
  } else {
    // SQLite configuration (development)
    console.log('🗄️ Using SQLite adapter...');
    const { PrismaBetterSqlite3 } = await import('@prisma/adapter-better-sqlite3');
    
    let dbPath = databaseUrl.replace('file:', '');

    // Resolve relative paths relative to server directory
    if (!path.isAbsolute(dbPath)) {
      // Resolve from the current working directory (server folder)
      dbPath = path.resolve(process.cwd(), dbPath);
    }

    console.log('SQLite - Database path:', {
      resolvedPath: dbPath,
      isAbsolute: path.isAbsolute(dbPath),
      exists: fs.existsSync(dbPath),
    });

    // Create absolute URL for adapter (use absolute path)
    const absoluteDatabaseUrl = `file:${dbPath}`;

    // Ensure DATABASE_URL is set with absolute path for adapter's internal use
    process.env.DATABASE_URL = absoluteDatabaseUrl;

    const adapter = new PrismaBetterSqlite3({
      url: absoluteDatabaseUrl,
    });

    return new PrismaClient({
      adapter,
      log: ['query', 'error', 'warn'],
    });
  }
}

const prisma = await createPrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.stockMovement.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Seed products matching frontend expectations
  console.log('📦 Creating products...');
  
  const products = [
    {
      sku: 'genie-for-him',
      name: 'Genie for Him',
      description: 'Boost Your Confidence & Vitality. A specially formulated drink designed to support male vitality and confidence. Our unique blend of natural ingredients enhances energy, stamina, and overall well-being.',
      price: 10.00,
      imageUrl: '/images/products/genie-for-him/genie-for-him-1.webp',
      category: ProductCategory.male,
      packageSize: PackageSize.single,
      isSubscribable: true,
    },
    {
      sku: 'genie-for-her',
      name: 'Genie for Her',
      description: 'Enhance Your Confidence & Wellness. A specially formulated drink designed to support female vitality and confidence. Our unique blend of natural ingredients enhances energy, mood, and overall well-being.',
      price: 10.00,
      imageUrl: '/images/products/genie-for-her/genie-for-her-1.webp',
      category: ProductCategory.female,
      packageSize: PackageSize.single,
      isSubscribable: true,
    },
    {
      sku: 'genie-for-him-12pack',
      name: 'Genie for Him - 12 Pack',
      description: 'Boost Your Confidence & Vitality - 12 Pack. Stock up and save with our 12-pack of Genie for Him. Perfect for regular use with significant savings per bottle.',
      price: 99.00,
      imageUrl: '/images/products/genie-for-him/genie-for-him-1.webp',
      category: ProductCategory.male,
      packageSize: PackageSize.twelve_pack,
      isSubscribable: true,
    },
    {
      sku: 'genie-for-her-12pack',
      name: 'Genie for Her - 12 Pack',
      description: 'Enhance Your Confidence & Wellness - 12 Pack. Stock up and save with our 12-pack of Genie for Her. Perfect for regular use with significant savings per bottle.',
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
    console.log(`✅ Created product: ${product.name} (SKU: ${product.sku})`);
  }

  // Create admin users
  console.log('👤 Creating admin users...');
  
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
  console.log(`✅ Created admin user: ${adminUser.email}`);

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
  console.log(`✅ Created super admin user: ${superAdminUser.email}`);

  // Create inventory records for all products
  console.log('📦 Creating inventory records...');
  
  const inventoryData = [
    { sku: 'genie-for-him', stock: 100, threshold: 10 },
    { sku: 'genie-for-her', stock: 100, threshold: 10 },
    { sku: 'genie-for-him-12pack', stock: 50, threshold: 5 },
    { sku: 'genie-for-her-12pack', stock: 50, threshold: 5 },
  ];

  for (const product of createdProducts) {
    const inventoryInfo = inventoryData.find(inv => inv.sku === product.sku);
    if (inventoryInfo) {
      const inventory = await prisma.inventory.create({
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

      // Create initial stock movement record
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

      console.log(`✅ Created inventory for ${product.name}: ${inventoryInfo.stock} units`);
    }
  }

  console.log('✅ Database seeding completed successfully!');
  console.log('🔗 Product SKUs available:');
  console.log('  - genie-for-him: Genie for Him ($10) - 100 units');
  console.log('  - genie-for-her: Genie for Her ($10) - 100 units');
  console.log('  - genie-for-him-12pack: Genie for Him 12-Pack ($99) - 50 units');
  console.log('  - genie-for-her-12pack: Genie for Her 12-Pack ($99) - 50 units');
  console.log('👤 Admin users created:');
  console.log('  - admin@lastgenie.com (password: admin123)');
  console.log('  - superadmin@lastgenie.com (password: superadmin123)');
}

async function runSeed() {
  try {
    await main();
  } catch (e) {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSeed();