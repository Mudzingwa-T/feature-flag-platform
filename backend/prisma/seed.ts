import { PrismaClient, Role, Strategy } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // --- Demo users ---
  const adminPassword = await bcrypt.hash('admin123', 10);
  const viewerPassword = await bcrypt.hash('viewer123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ff.local' },
    update: {},
    create: { email: 'admin@ff.local', password: adminPassword, role: Role.ADMIN },
  });
  await prisma.user.upsert({
    where: { email: 'viewer@ff.local' },
    update: {},
    create: { email: 'viewer@ff.local', password: viewerPassword, role: Role.VIEWER },
  });

  // --- Environments ---
  const dev = await prisma.environment.upsert({
    where: { key: 'DEV' },
    update: {},
    create: { key: 'DEV', name: 'Development' },
  });
  const prod = await prisma.environment.upsert({
    where: { key: 'PROD' },
    update: {},
    create: { key: 'PROD', name: 'Production' },
  });

  // --- Demo flags ---
  await prisma.flag.upsert({
    where: { key_environmentId: { key: 'new-checkout', environmentId: prod.id } },
    update: {},
    create: {
      key: 'new-checkout',
      description: 'Redesigned checkout flow',
      enabled: true,
      strategy: Strategy.PERCENTAGE_ROLLOUT,
      rolloutPercentage: 20,
      constraints: { includeCities: ['Harare'], excludeInternal: true },
      environmentId: prod.id,
      updatedBy: admin.email,
    },
  });

  await prisma.flag.upsert({
    where: { key_environmentId: { key: 'new-checkout', environmentId: dev.id } },
    update: {},
    create: {
      key: 'new-checkout',
      description: 'Redesigned checkout flow',
      enabled: true,
      strategy: Strategy.BOOLEAN,
      environmentId: dev.id,
      updatedBy: admin.email,
    },
  });

  await prisma.flag.upsert({
    where: { key_environmentId: { key: 'dark-mode', environmentId: prod.id } },
    update: {},
    create: {
      key: 'dark-mode',
      description: 'Global dark theme',
      enabled: false,
      strategy: Strategy.BOOLEAN,
      environmentId: prod.id,
      updatedBy: admin.email,
    },
  });

  console.log('Seed complete. Users: admin@ff.local/admin123, viewer@ff.local/viewer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
