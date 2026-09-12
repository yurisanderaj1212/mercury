import { PrismaClient, UserRole, SourceName, PlanName } from '@prisma/client';
import { HAVANA_MUNICIPALITIES } from './data/locations';
import { INITIAL_CATEGORIES, CategorySeed } from './data/categories';

const prisma = new PrismaClient();

async function seedRoles(): Promise<void> {
  console.log('Seeding roles...');
  const roles: UserRole[] = ['PERSONAL', 'BUSINESS', 'SELLER', 'ADMIN'];
  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  ✓ ${roles.length} roles seeded`);
}

async function seedSources(): Promise<void> {
  console.log('Seeding sources...');
  const sources: SourceName[] = ['FACEBOOK', 'REVOLICO', 'MANUAL', 'IMPORT', 'API'];
  for (const name of sources) {
    await prisma.source.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  ✓ ${sources.length} sources seeded`);
}

async function seedLocations(): Promise<void> {
  console.log('Seeding locations (Municipios de La Habana)...');
  for (const loc of HAVANA_MUNICIPALITIES) {
    await prisma.location.upsert({
      where: {
        province_municipality_zone: {
          province: loc.province,
          municipality: loc.municipality,
          zone: null,
        },
      },
      update: {},
      create: {
        province: loc.province,
        municipality: loc.municipality,
      },
    });
  }
  console.log(`  ✓ ${HAVANA_MUNICIPALITIES.length} locations seeded`);
}

async function seedCategoryTree(
  categories: CategorySeed[],
  parentId: string | null = null,
): Promise<void> {
  for (const cat of categories) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });

    let categoryId: string;

    if (existing) {
      categoryId = existing.id;
    } else {
      const created = await prisma.category.create({
        data: {
          name: cat.name,
          description: cat.description,
          slug: cat.slug,
          parentCategoryId: parentId,
        },
      });
      categoryId = created.id;
    }

    if (cat.children && cat.children.length > 0) {
      await seedCategoryTree(cat.children, categoryId);
    }
  }
}

async function seedCategories(): Promise<void> {
  console.log('Seeding categories...');
  await seedCategoryTree(INITIAL_CATEGORIES);
  const total = await prisma.category.count();
  console.log(`  ✓ ${total} categories seeded`);
}

async function seedPlans(): Promise<void> {
  console.log('Seeding SaaS plans (scaffold)...');
  const plans: Array<{ name: PlanName; alertLimit: number; priceUsd: number }> = [
    { name: 'FREE',         alertLimit: 20,  priceUsd: 0 },
    { name: 'PROFESSIONAL', alertLimit: 100, priceUsd: 9.99 },
    { name: 'BUSINESS',     alertLimit: 500, priceUsd: 29.99 },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: {
        name: plan.name,
        alertLimit: plan.alertLimit,
        priceUsd: plan.priceUsd,
      },
    });
  }
  console.log(`  ✓ ${plans.length} plans seeded`);
}

async function main(): Promise<void> {
  console.log('\n🌱 Starting Mercury seed...\n');

  await seedRoles();
  await seedSources();
  await seedLocations();
  await seedCategories();
  await seedPlans();

  console.log('\n✅ Seed completed successfully!\n');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
