/**
 * LOCAL / BOOTSTRAP ONLY — idempotent demo tenant + four role identities.
 *
 * Usage (from apps/api):
 *   DEMO_LOGIN_PASSWORD='***' npm run db:seed:demo-users
 *
 * Optional:
 *   DEMO_TENANT_SLUG=wcos-demo
 *   DEMO_TENANT_ADMIN_EMAIL=demo.tenant-admin@wcos.local
 *   DEMO_HR_ADMIN_EMAIL=demo.hr-admin@wcos.local
 *   DEMO_MANAGER_EMAIL=demo.manager@wcos.local
 *   DEMO_EMPLOYEE_EMAIL=demo.employee@wcos.local
 *
 * Never prints the password. Safe to re-run.
 */
import { PrismaClient } from '@prisma/client';
import { seedDemoUsers } from '../src/database/seed/demo-users.seed';

const prisma = new PrismaClient();

async function main() {
  const result = await seedDemoUsers(prisma);

  console.log(
    JSON.stringify(
      {
        ok: true,
        scope: 'demo-users',
        tenantId: result.tenantId,
        tenantSlug: result.tenantSlug,
        displayName: result.displayName,
        tenantLoginUrl: `/t/${result.tenantSlug}/login`,
        users: result.users,
        organisation: result.organisation,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
