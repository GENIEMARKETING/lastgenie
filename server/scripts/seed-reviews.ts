import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';

// Create SQLite database connection (same as main app)
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

// Ensure DATABASE_URL is set in environment for Prisma's internal use
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

let dbPath = databaseUrl.replace('file:', '');

// Resolve relative paths relative to server directory
if (!path.isAbsolute(dbPath)) {
  // Resolve from the current working directory (server folder)
  dbPath = path.resolve(process.cwd(), dbPath);
}

// Create absolute URL for adapter (use absolute path)
const absoluteDatabaseUrl = `file:${dbPath}`;

// Ensure DATABASE_URL is set with absolute path for adapter's internal use
process.env.DATABASE_URL = absoluteDatabaseUrl;

// Create Prisma adapter with URL option
const adapter = new PrismaBetterSqlite3({
  url: absoluteDatabaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const reviewTemplates = {
  positive: [
    "Amazing product! Really works as advertised.",
    "Great quality and fast shipping. Highly recommend!",
    "Been using for months now and love the results.",
    "Excellent customer service and discrete packaging.",
    "Worth every penny. Will definitely order again.",
    "Game changer! I feel more confident and energetic.",
    "The taste is actually pleasant, which was a nice surprise.",
    "Noticed improvements within a week. Very satisfied!",
    "Quality product that delivers on its promises.",
    "Fast shipping and discrete packaging. Perfect!",
    "Outstanding results and great customer support.",
    "Exactly what I was looking for. 5 stars!",
    "High quality ingredients and effective formula.",
    "Professional service and excellent product quality.",
    "Been a customer for over a year now. Always reliable.",
    "Discreet packaging was perfect. Great product too!",
    "Really impressed with the quality and effectiveness.",
    "Customer service went above and beyond to help.",
    "Fast acting and long lasting effects. Highly recommend!",
    "Perfect for my needs. Will definitely reorder.",
  ],
  neutral: [
    "Good product overall, though took a while to see results.",
    "Decent quality, shipping was a bit slow but arrived safely.",
    "Works as expected, nothing extraordinary but solid.",
    "Product is fine, though I expected more for the price.",
    "Takes some time to work but eventually does the job.",
    "Average experience. Product works but could be improved.",
    "Shipping took longer than expected but product is okay.",
    "It's alright. Does what it says but nothing special.",
    "Good value for money. Results took a few weeks to show.",
    "Product quality is decent for the price point.",
    "Works but took longer than advertised to see effects.",
    "Okay product but customer service could be better.",
    "Does the job but packaging could be more eco-friendly.",
    "Fair product, though I've had better experiences elsewhere.",
    "Reasonable quality but delivery was delayed.",
  ],
  negative: [
    "Didn't work as well as I hoped.",
    "Product was fine but shipping took too long.",
    "Not bad but expected more for the price.",
    "Results were minimal. Might try something else next time.",
    "Took forever to ship and results were disappointing.",
    "Product quality was okay but customer service was poor.",
    "Didn't see the results I was expecting.",
    "Overpriced for what you get in my opinion.",
    "Shipping was delayed and product didn't meet expectations.",
    "Had higher hopes based on the marketing.",
  ]
};

const names = [
  "Sarah M.", "Mike R.", "Jessica L.", "David K.", "Emma T.", 
  "Chris P.", "Ashley W.", "Ryan B.", "Amanda H.", "Justin F.",
  "Lisa C.", "Mark T.", "Rachel S.", "Tom H.", "Maria G.",
  "Alex B.", "Samantha D.", "Jake M.", "Nicole R.", "Brian K.",
  "Amy L.", "Steve W.", "Jennifer P.", "Kevin S.", "Lauren F.",
  "Matt C.", "Stephanie H.", "Ryan D.", "Michelle B.", "Daniel A.",
  "Chloe T.", "Nathan P.", "Vanessa K.", "Tyler J.", "Rebecca M.",
  "Austin L.", "Megan S.", "Jordan H.", "Brittany C.", "Brandon T.",
  "Taylor R.", "Cameron W.", "Morgan L.", "Casey D.", "Avery B.",
  "Riley K.", "Peyton M.", "Blake S.", "Skylar H.", "Quinn F.",
  "Dakota C.", "Sage T.", "River P.", "Phoenix L.", "Rowan B.",
  "Emery K.", "Finley M.", "Hayden S.", "Parker H.", "Reese F.",
  "Charlie C.", "Drew T.", "Casey P.", "Jamie L.", "Alexis B.",
  "Jordan K.", "Taylor M.", "Morgan S.", "Ryan H.", "Avery F.",
  "Blake C.", "Cameron T.", "Dakota P.", "Emery L.", "Finley B.",
  "Hayden K.", "Parker M.", "Quinn S.", "Reese H.", "River F.",
  "Rowan C.", "Sage T.", "Skylar P.", "Phoenix L.", "Peyton B.",
  "Riley K.", "Casey M.", "Drew S.", "Jamie H.", "Alexis F.",
  "Charlie C.", "Jordan T.", "Taylor P.", "Morgan L.", "Avery B.",
  "Blake K.", "Cameron M.", "Dakota S.", "Emery H.", "Finley F.",
  "Hayden C.", "Parker T.", "Quinn P.", "Reese L.", "River B.",
  "Rowan K.", "Sage M.", "Skylar S.", "Phoenix H.", "Peyton F.",
  "Riley C.", "Casey T.", "Drew P.", "Jamie L.", "Alexis B.",
  "Charlie K.", "Jordan M.", "Taylor S.", "Morgan H.", "Avery F.",
  "Blake C.", "Cameron T.", "Dakota P.", "Emery L.", "Finley B.",
  "Hayden K.", "Parker M.", "Quinn S.", "Reese H.", "River F.",
  "Rowan C.", "Sage T.", "Skylar P.", "Phoenix L.", "Peyton B.",
  "Riley K.", "Casey M.", "Drew S.", "Jamie H.", "Alexis F."
];

async function seedReviews() {
  console.log('Starting to seed reviews...');

  // Get product SKUs
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { category: 'male' },
        { category: 'female' }
      ]
    },
    select: {
      sku: true,
      name: true,
      category: true
    }
  });

  console.log(`Found ${products.length} products:`, products);

  const maleProducts = products.filter(p => p.category === 'male');
  const femaleProducts = products.filter(p => p.category === 'female');

  console.log(`Male products: ${maleProducts.length}, Female products: ${femaleProducts.length}`);

  // Clear existing reviews first
  await prisma.review.deleteMany({});
  console.log('Cleared existing reviews');

  // Create reviews for male products (102 total)
  console.log('Creating reviews for male products...');
  for (let i = 0; i < 102; i++) {
    const product = maleProducts[Math.floor(Math.random() * maleProducts.length)];
    const rating = weightedRandomRating();
    const template = selectTemplate(rating);
    
    await prisma.review.create({
      data: {
        productSku: product.sku,
        guestName: names[Math.floor(Math.random() * names.length)],
        rating,
        content: template,
        verified: Math.random() > 0.3, // 70% verified
        helpful: Math.floor(Math.random() * 20),
        createdAt: randomDate(),
      }
    });

    if (i % 10 === 0) console.log(`Created ${i + 1}/102 male product reviews`);
  }

  // Create reviews for female products (115 total)
  console.log('Creating reviews for female products...');
  for (let i = 0; i < 115; i++) {
    const product = femaleProducts[Math.floor(Math.random() * femaleProducts.length)];
    const rating = weightedRandomRating();
    const template = selectTemplate(rating);
    
    await prisma.review.create({
      data: {
        productSku: product.sku,
        guestName: names[Math.floor(Math.random() * names.length)],
        rating,
        content: template,
        verified: Math.random() > 0.3, // 70% verified
        helpful: Math.floor(Math.random() * 20),
        createdAt: randomDate(),
      }
    });

    if (i % 10 === 0) console.log(`Created ${i + 1}/115 female product reviews`);
  }

  const totalReviews = await prisma.review.count();
  console.log(`Successfully created ${totalReviews} reviews total!`);

  // Log some stats
  const averageRating = await prisma.review.aggregate({
    _avg: { rating: true },
    _count: { rating: true }
  });

  console.log(`Average rating: ${averageRating._avg.rating?.toFixed(2)}`);
  console.log(`Total reviews: ${averageRating._count.rating}`);

  const ratingBreakdown = await prisma.review.groupBy({
    by: ['rating'],
    _count: { rating: true },
    orderBy: { rating: 'desc' }
  });

  console.log('Rating breakdown:');
  ratingBreakdown.forEach(r => {
    console.log(`${r.rating} stars: ${r._count.rating} reviews`);
  });
}

function weightedRandomRating(): number {
  const rand = Math.random();
  if (rand < 0.5) return 5;  // 50% 5-star
  if (rand < 0.8) return 4;  // 30% 4-star
  if (rand < 0.95) return 3; // 15% 3-star
  if (rand < 0.98) return 2; // 3% 2-star
  return 1; // 2% 1-star
}

function selectTemplate(rating: number): string {
  if (rating >= 4) return reviewTemplates.positive[Math.floor(Math.random() * reviewTemplates.positive.length)];
  if (rating === 3) return reviewTemplates.neutral[Math.floor(Math.random() * reviewTemplates.neutral.length)];
  return reviewTemplates.negative[Math.floor(Math.random() * reviewTemplates.negative.length)];
}

function randomDate(): Date {
  const start = new Date(2023, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Run the seeding
seedReviews()
  .catch((error) => {
    console.error('Error seeding reviews:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });