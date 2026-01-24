const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Set up database path
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
let dbPath = databaseUrl.replace('file:', '');

// Resolve relative paths relative to server directory
if (!path.isAbsolute(dbPath)) {
  dbPath = path.resolve(__dirname, '..', dbPath);
}

// Create absolute URL for adapter
const absoluteDatabaseUrl = `file:${dbPath}`;
process.env.DATABASE_URL = absoluteDatabaseUrl;

// Create Prisma adapter
const adapter = new PrismaBetterSqlite3({
  url: absoluteDatabaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

async function updateProductDimensions() {
  try {
    console.log('Updating product dimensions...');

    // Get all products
    const products = await prisma.product.findMany();
    console.log(`Found ${products.length} products to update`);

    for (const product of products) {
      let weight, length, width, height;

      // Determine dimensions based on package size
      if (product.packageSize === 'single') {
        // Single bottle: 0.0022 lbs, dimensions based on 1.25" diameter x 3.25" height
        // Box dimensions: 2" x 2" x 4"
        weight = 0.0022;
        length = 2.0;  // Box length
        width = 2.0;   // Box width  
        height = 4.0;  // Box height
      } else if (product.packageSize === 'twelve_pack') {
        // 12-pack: 0.0264 lbs (12 * 0.0022), dimensions 6.5" x 5" x 3.5"
        weight = 0.0264;
        length = 6.5;
        width = 5.0;
        height = 3.5;
      }

      // Update the product
      await prisma.product.update({
        where: { id: product.id },
        data: {
          weight,
          length,
          width,
          height,
        },
      });

      console.log(`Updated ${product.name} (${product.packageSize}): ${weight}lbs, ${length}"x${width}"x${height}"`);
    }

    console.log('✅ Product dimensions updated successfully!');
  } catch (error) {
    console.error('❌ Error updating product dimensions:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateProductDimensions();