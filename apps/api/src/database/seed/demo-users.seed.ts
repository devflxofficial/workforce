/**
 * Idempotent development/demo tenant with four single-role identities for UI verification.
 *
 * Requires DEMO_LOGIN_PASSWORD (>=8 chars). Optional overrides:
 *   DEMO_TENANT_SLUG, DEMO_TENANT_ADMIN_EMAIL, DEMO_HR_ADMIN_EMAIL,
 *   DEMO_MANAGER_EMAIL, DEMO_EMPLOYEE_EMAIL
 */
import type { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ensureM07PermissionsForTenant } from './m07-permissions.seed';
import { ensureTenantAdminPermissionsForTenant } from './tenant-admin-permissions.seed';
import { ensureHrConsolePermissionsForTenant } from './hr-console-permissions.seed';
import { ensureEssPermissionsForTenant } from './ess-permissions.seed';
import { ensureDepartmentManagerPermissionsForTenant } from './manager-permissions.seed';

export const DEMO_TENANT_DISPLAY_NAME = 'WCOS Demo Organisation';
export const DEFAULT_DEMO_TENANT_SLUG = 'wcos-demo';

export const DEFAULT_DEMO_EMAILS = {
  tenantAdmin: 'demo.tenant-admin@wcos.local',
  hrAdmin: 'demo.hr-admin@wcos.local',
  manager: 'demo.manager@wcos.local',
  employee: 'demo.employee@wcos.local',
} as const;

export const DEMO_ROLE_NAMES = {
  tenantAdmin: 'Tenant Admin',
  hrAdmin: 'HR Manager',
  manager: 'Department Manager',
  employee: 'Employee',
} as const;

export interface SeedDemoUsersOptions {
  password?: string;
  tenantSlug?: string;
  emails?: Partial<Record<keyof typeof DEFAULT_DEMO_EMAILS, string>>;
}

export interface SeedDemoUsersResult {
  tenantId: string;
  tenantSlug: string;
  displayName: string;
  users: Record<
    keyof typeof DEFAULT_DEMO_EMAILS,
    { userId: string; email: string; roleName: string; employeeId?: string }
  >;
  organisation: {
    legalEntityId: string;
    branchId: string;
    departmentId: string;
    positionId: string;
  };
}

function resolveDemoEmails(
  overrides?: Partial<Record<keyof typeof DEFAULT_DEMO_EMAILS, string>>,
): Record<keyof typeof DEFAULT_DEMO_EMAILS, string> {
  return {
    tenantAdmin:
      (overrides?.tenantAdmin ?? process.env.DEMO_TENANT_ADMIN_EMAIL ?? DEFAULT_DEMO_EMAILS.tenantAdmin)
        .trim()
        .toLowerCase(),
    hrAdmin:
      (overrides?.hrAdmin ?? process.env.DEMO_HR_ADMIN_EMAIL ?? DEFAULT_DEMO_EMAILS.hrAdmin)
        .trim()
        .toLowerCase(),
    manager:
      (overrides?.manager ?? process.env.DEMO_MANAGER_EMAIL ?? DEFAULT_DEMO_EMAILS.manager)
        .trim()
        .toLowerCase(),
    employee:
      (overrides?.employee ?? process.env.DEMO_EMPLOYEE_EMAIL ?? DEFAULT_DEMO_EMAILS.employee)
        .trim()
        .toLowerCase(),
  };
}

async function ensureDemoUser(
  prisma: PrismaClient,
  args: {
    email: string;
    displayName: string;
    passwordHash: string;
    tenantId: string;
    roleName: string;
  },
) {
  let user = await prisma.appUser.findUnique({ where: { email: args.email } });
  if (!user) {
    user = await prisma.appUser.create({
      data: {
        email: args.email,
        emailNormalised: args.email,
        displayName: args.displayName,
        displayNameLegacy: args.displayName,
        userType: 'HUMAN',
        status: 'ACTIVE',
        isActive: true,
      },
    });
  } else {
    user = await prisma.appUser.update({
      where: { id: user.id },
      data: { status: 'ACTIVE', isActive: true, platformRole: null },
    });
  }

  const existingCred = await prisma.passwordCredential.findUnique({
    where: { userId: user.id },
  });
  if (!existingCred) {
    await prisma.passwordCredential.create({
      data: { userId: user.id, passwordHash: args.passwordHash },
    });
  } else {
    await prisma.passwordCredential.update({
      where: { userId: user.id },
      data: { passwordHash: args.passwordHash },
    });
  }

  const role = await prisma.role.findFirst({
    where: { tenantId: args.tenantId, name: args.roleName },
    select: { id: true },
  });
  if (!role) {
    throw new Error(`Role "${args.roleName}" missing for demo tenant ${args.tenantId}.`);
  }

  const assignment = await prisma.roleAssignment.findFirst({
    where: { userId: user.id, tenantId: args.tenantId, roleId: role.id },
  });
  if (!assignment) {
    await prisma.roleAssignment.create({
      data: {
        userId: user.id,
        roleId: role.id,
        tenantId: args.tenantId,
        grantedBy: null,
      },
    });
  }

  // Demo identities are single-role for predictable QA.
  await prisma.roleAssignment.deleteMany({
    where: {
      userId: user.id,
      tenantId: args.tenantId,
      roleId: { not: role.id },
    },
  });

  return { user, roleId: role.id };
}

export async function seedDemoUsers(
  prisma: PrismaClient,
  options?: SeedDemoUsersOptions,
): Promise<SeedDemoUsersResult> {
  const password = options?.password ?? process.env.DEMO_LOGIN_PASSWORD ?? '';
  if (!password || password.length < 8) {
    throw new Error('Set DEMO_LOGIN_PASSWORD (>=8 chars) before running demo users seed.');
  }

  const tenantSlug = (
    options?.tenantSlug ??
    process.env.DEMO_TENANT_SLUG ??
    DEFAULT_DEMO_TENANT_SLUG
  )
    .trim()
    .toLowerCase();

  const emails = resolveDemoEmails(options?.emails);
  const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
  const passwordHash = await bcrypt.hash(password, rounds);

  const region = await prisma.deploymentRegion.findFirst({ where: { status: 'ACTIVE' } });
  const plan =
    (await prisma.plan.findFirst({ where: { code: 'growth', status: 'ACTIVE' } })) ??
    (await prisma.plan.findFirst({ where: { status: 'ACTIVE' } }));
  if (!region || !plan) {
    throw new Error('Reference catalogue missing: run db:seed:reference-catalogue and plan seed first.');
  }

  let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    tenant = await prisma.$transaction(async (tx) => {
      const created = await tx.tenant.create({
        data: {
          displayName: DEMO_TENANT_DISPLAY_NAME,
          legalName: `${DEMO_TENANT_DISPLAY_NAME} Ltd`,
          slug: tenantSlug,
          countryCode: 'PK',
          baseCurrency: 'PKR',
          defaultTimezone: 'Asia/Karachi',
          defaultLocale: 'en',
          deploymentRegionId: region.id,
          planId: plan.id,
          planKey: plan.code,
          status: 'ACTIVE',
          activatedAt: new Date(),
          createdBy: 'demo-users-seed',
        },
      });

      await tx.tenantSubscription.create({
        data: {
          tenantId: created.id,
          planId: plan.id,
          planKey: plan.code,
          status: 'ACTIVE',
          billingCycle: 'monthly',
          seatLimit: 50,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()),
        },
      });

      await ensureM07PermissionsForTenant(tx, created.id);
      await ensureTenantAdminPermissionsForTenant(tx, created.id);
      await ensureHrConsolePermissionsForTenant(tx, created.id);
      await ensureEssPermissionsForTenant(tx, created.id);
      await ensureDepartmentManagerPermissionsForTenant(tx, created.id);

      return created;
    });
  } else if (tenant.status !== 'ACTIVE') {
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'ACTIVE', activatedAt: new Date() },
    });
    await ensureM07PermissionsForTenant(prisma, tenant.id);
    await ensureTenantAdminPermissionsForTenant(prisma, tenant.id);
    await ensureHrConsolePermissionsForTenant(prisma, tenant.id);
    await ensureEssPermissionsForTenant(prisma, tenant.id);
    await ensureDepartmentManagerPermissionsForTenant(prisma, tenant.id);
  } else {
    await ensureTenantAdminPermissionsForTenant(prisma, tenant.id);
    await ensureDepartmentManagerPermissionsForTenant(prisma, tenant.id);
  }

  const tenantId = tenant.id;

  let legalEntity = await prisma.legalEntity.findFirst({
    where: { tenantId, isPrimary: true, status: 'ACTIVE' },
  });
  if (!legalEntity) {
    legalEntity = await prisma.legalEntity.create({
      data: {
        tenantId,
        name: `${DEMO_TENANT_DISPLAY_NAME} (PK)`,
        countryCode: 'PK',
        currencyCode: 'PKR',
        timezone: 'Asia/Karachi',
        isPrimary: true,
        status: 'ACTIVE',
      },
    });
  }

  let branch = await prisma.branch.findFirst({
    where: { tenantId, legalEntityId: legalEntity.id, status: 'ACTIVE' },
  });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        tenantId,
        legalEntityId: legalEntity.id,
        name: 'Demo HQ',
        code: 'DEMO-HQ',
        countryCode: 'PK',
        timezone: 'Asia/Karachi',
        status: 'ACTIVE',
      },
    });
  }

  let department = await prisma.department.findFirst({
    where: { tenantId, name: 'Operations' },
  });
  if (!department) {
    department = await prisma.department.create({
      data: {
        tenantId,
        legalEntityId: legalEntity.id,
        branchId: branch.id,
        name: 'Operations',
        code: 'OPS',
        status: 'ACTIVE',
      },
    });
  }

  let position = await prisma.position.findFirst({
    where: { tenantId, title: 'Team Lead' },
  });
  if (!position) {
    position = await prisma.position.create({
      data: {
        tenantId,
        legalEntityId: legalEntity.id,
        title: 'Team Lead',
        code: 'TL-01',
        isManager: true,
        status: 'ACTIVE',
      },
    });
  }

  const tenantAdmin = await ensureDemoUser(prisma, {
    email: emails.tenantAdmin,
    displayName: 'Demo Tenant Admin',
    passwordHash,
    tenantId,
    roleName: DEMO_ROLE_NAMES.tenantAdmin,
  });

  const hrAdmin = await ensureDemoUser(prisma, {
    email: emails.hrAdmin,
    displayName: 'Demo HR Admin',
    passwordHash,
    tenantId,
    roleName: DEMO_ROLE_NAMES.hrAdmin,
  });

  const managerUser = await ensureDemoUser(prisma, {
    email: emails.manager,
    displayName: 'Demo Manager',
    passwordHash,
    tenantId,
    roleName: DEMO_ROLE_NAMES.manager,
  });

  const employeeUser = await ensureDemoUser(prisma, {
    email: emails.employee,
    displayName: 'Demo Employee',
    passwordHash,
    tenantId,
    roleName: DEMO_ROLE_NAMES.employee,
  });

  let managerEmployee = await prisma.employee.findFirst({
    where: { tenantId, userId: managerUser.user.id },
  });
  if (!managerEmployee) {
    managerEmployee = await prisma.employee.create({
      data: {
        tenantId,
        legalEntityId: legalEntity.id,
        branchId: branch.id,
        departmentId: department.id,
        positionId: position.id,
        userId: managerUser.user.id,
        employeeNumber: 'DEMO-MGR-001',
        firstName: 'Demo',
        lastName: 'Manager',
        displayName: 'Demo Manager',
        emailWork: emails.manager,
        hireDate: new Date('2024-01-15'),
        status: 'ACTIVE',
        employmentType: 'FULL_TIME',
      },
    });
  } else {
    managerEmployee = await prisma.employee.update({
      where: { id: managerEmployee.id },
      data: {
        userId: managerUser.user.id,
        departmentId: department.id,
        positionId: position.id,
        status: 'ACTIVE',
      },
    });
  }

  let reportEmployee = await prisma.employee.findFirst({
    where: { tenantId, userId: employeeUser.user.id },
  });
  if (!reportEmployee) {
    reportEmployee = await prisma.employee.create({
      data: {
        tenantId,
        legalEntityId: legalEntity.id,
        branchId: branch.id,
        departmentId: department.id,
        managerId: managerEmployee.id,
        userId: employeeUser.user.id,
        employeeNumber: 'DEMO-EMP-001',
        firstName: 'Demo',
        lastName: 'Employee',
        displayName: 'Demo Employee',
        emailWork: emails.employee,
        hireDate: new Date('2024-06-01'),
        status: 'ACTIVE',
        employmentType: 'FULL_TIME',
      },
    });
  } else {
    reportEmployee = await prisma.employee.update({
      where: { id: reportEmployee.id },
      data: {
        userId: employeeUser.user.id,
        managerId: managerEmployee.id,
        departmentId: department.id,
        status: 'ACTIVE',
      },
    });
  }

  return {
    tenantId,
    tenantSlug,
    displayName: tenant.displayName,
    users: {
      tenantAdmin: {
        userId: tenantAdmin.user.id,
        email: emails.tenantAdmin,
        roleName: DEMO_ROLE_NAMES.tenantAdmin,
      },
      hrAdmin: {
        userId: hrAdmin.user.id,
        email: emails.hrAdmin,
        roleName: DEMO_ROLE_NAMES.hrAdmin,
      },
      manager: {
        userId: managerUser.user.id,
        email: emails.manager,
        roleName: DEMO_ROLE_NAMES.manager,
        employeeId: managerEmployee.id,
      },
      employee: {
        userId: employeeUser.user.id,
        email: emails.employee,
        roleName: DEMO_ROLE_NAMES.employee,
        employeeId: reportEmployee.id,
      },
    },
    organisation: {
      legalEntityId: legalEntity.id,
      branchId: branch.id,
      departmentId: department.id,
      positionId: position.id,
    },
  };
}
