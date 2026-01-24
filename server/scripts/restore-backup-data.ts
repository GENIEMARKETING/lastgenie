import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function restoreBackupData() {
  console.log('Starting backup data restoration...');

  try {
    // Read the backup SQL file
    const backupPath = path.join(__dirname, '..', 'backup.sql');
    
    if (!fs.existsSync(backupPath)) {
      console.log('No backup.sql found, skipping backup restoration');
      return;
    }

    const backupSql = fs.readFileSync(backupPath, 'utf8');
    
    // Extract INSERT statements for important tables
    const insertStatements = backupSql
      .split('\n')
      .filter(line => 
        line.startsWith('INSERT INTO "products"') ||
        line.startsWith('INSERT INTO "users"') ||
        line.startsWith('INSERT INTO "addresses"') ||
        line.startsWith('INSERT INTO "inventory"') ||
        line.startsWith('INSERT INTO "orders"') ||
        line.startsWith('INSERT INTO "order_items"')
      );

    console.log(`Found ${insertStatements.length} INSERT statements to restore`);

    // Execute each INSERT statement
    for (const statement of insertStatements) {
      try {
        // Convert SQLite INSERT to raw SQL execution
        await prisma.$executeRawUnsafe(statement);
      } catch (error) {
        console.log(`Skipping statement due to constraint: ${statement.substring(0, 100)}...`);
        // Continue with other statements even if some fail due to constraints
      }
    }

    console.log('Backup data restoration completed successfully!');

    // Verify what was restored
    const productCount = await prisma.product.count();
    const userCount = await prisma.user.count();
    const orderCount = await prisma.order.count();

    console.log(`Restored: ${productCount} products, ${userCount} users, ${orderCount} orders`);

  } catch (error) {
    console.error('Error during backup restoration:', error);
    console.log('Continuing with fresh database...');
  }
}

// Alternative approach: Extract specific data from backup and recreate using Prisma
async function restoreEssentialData() {
  console.log('Restoring essential product data...');

  // Create essential products if they don't exist
  const existingProducts = await prisma.product.count();
  
  if (existingProducts === 0) {
    console.log('Creating essential products...');
    
    // Create Genie for Him product
    await prisma.product.upsert({
      where: { sku: 'GENIE-HIM-50ML' },
      update: {},
      create: {
        sku: 'GENIE-HIM-50ML',
        name: 'Genie for Him',
        description: 'Male sexual enhancer - 50ML bottle designed to boost confidence and energy',
        price: 10.00,
        category: 'male',
        packageSize: 'single',
        isActive: true,
        isFeatured: true,
        displayOrder: 1
      }
    });

    // Create Genie for Her product
    await prisma.product.upsert({
      where: { sku: 'GENIE-HER-50ML' },
      update: {},
      create: {
        sku: 'GENIE-HER-50ML',
        name: 'Genie for Her',
        description: 'Female sexual enhancer - 50ML bottle designed to boost confidence and energy',
        price: 10.00,
        category: 'female',
        packageSize: 'single',
        isActive: true,
        isFeatured: true,
        displayOrder: 2
      }
    });

    // Create 12-pack products
    await prisma.product.upsert({
      where: { sku: 'GENIE-HIM-12PACK' },
      update: {},
      create: {
        sku: 'GENIE-HIM-12PACK',
        name: 'Genie for Him - 12 Pack',
        description: 'Male sexual enhancer - 12 pack of 50ML bottles',
        price: 99.00,
        category: 'male',
        packageSize: 'twelve_pack',
        isActive: true,
        isFeatured: true,
        displayOrder: 3
      }
    });

    await prisma.product.upsert({
      where: { sku: 'GENIE-HER-12PACK' },
      update: {},
      create: {
        sku: 'GENIE-HER-12PACK',
        name: 'Genie for Her - 12 Pack',
        description: 'Female sexual enhancer - 12 pack of 50ML bottles',
        price: 99.00,
        category: 'female',
        packageSize: 'twelve_pack',
        isActive: true,
        isFeatured: true,
        displayOrder: 4
      }
    });

    console.log('Essential products created successfully!');
  } else {
    console.log(`Found ${existingProducts} existing products, skipping product creation`);
  }
}

async function main() {
  try {
    // Try to restore from backup first
    await restoreBackupData();
    
    // Ensure essential products exist
    await restoreEssentialData();
    
    console.log('Data restoration completed!');
  } catch (error) {
    console.error('Error in restoration process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();