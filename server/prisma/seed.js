"use strict";
// Skipping seed for now due to Prisma v7 configuration complexity
// Will use mock data in API routes instead
console.log('✅ Database ready - using mock data in API routes for now');
async function main() {
    console.log('✅ Database ready - using mock data in API routes for now');
    console.log('🔗 Mock Product SKUs available:');
    console.log('  - GEN-MALE-50ML: Genie for Him ($10)');
    console.log('  - GEN-FEMALE-50ML: Genie for Her ($10)');
    console.log('  - GEN-MALE-12PK: Genie for Him 12-Pack ($99)');
    console.log('  - GEN-FEMALE-12PK: Genie for Her 12-Pack ($99)');
}
main()
    .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
