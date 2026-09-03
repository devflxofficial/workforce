/**
 * Department Manager permission catalogue seed.
 * Attaches team-scoped manager permissions to the Department Manager system role.
 */
import type { Prisma, PrismaClient } from '@prisma/client';
import { DEPARTMENT_MANAGER_PERMISSION_CODES } from '../../common/constants/permissions.constants';

type DbClient = PrismaClient | Prisma.TransactionClient;

export const DEPARTMENT_MANAGER_ROLE_NAME = 'Department Manager';

function splitPermissionCode(code: string): { action: string; resource: string; scope: string } {
  const parts = code.split(':');
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    return { action: parts[0], resource: parts[1], scope: parts[2] };
  }
  return { action: code, resource: '.', scope: '.' };
}

async function ensurePermission(prisma: DbClient, code: string) {
  const { action, resource, scope } = splitPermissionCode(code);
  return prisma.permission.upsert({
    where: { action_resource_scope: { action, resource, scope } },
    create: {
      action,
      resource,
      scope,
      description: `Department Manager: ${code}`,
    },
    update: {},
  });
}

async function attachPermissions(
  prisma: DbClient,
  roleId: string,
  permissionIds: string[],
): Promise<void> {
  for (const permissionId of permissionIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      create: { roleId, permissionId },
      update: {},
    });
  }
}

export async function seedDepartmentManagerPermissions(
  prisma: DbClient,
  options?: { tenantId?: string },
): Promise<{ permissions: string[]; rolesUpdated: number }> {
  const rows = [];
  for (const code of DEPARTMENT_MANAGER_PERMISSION_CODES) {
    rows.push(await ensurePermission(prisma, code));
  }
  const permissionIds = rows.map((r) => r.id);

  const roles = await prisma.role.findMany({
    where: {
      ...(options?.tenantId ? { tenantId: options.tenantId } : {}),
      name: { equals: DEPARTMENT_MANAGER_ROLE_NAME, mode: 'insensitive' },
    },
    select: { id: true },
  });

  for (const role of roles) {
    await attachPermissions(prisma, role.id, permissionIds);
  }

  return {
    permissions: [...DEPARTMENT_MANAGER_PERMISSION_CODES],
    rolesUpdated: roles.length,
  };
}

export async function ensureDepartmentManagerPermissionsForTenant(
  prisma: DbClient,
  tenantId: string,
): Promise<void> {
  let role = await prisma.role.findFirst({
    where: { tenantId, name: DEPARTMENT_MANAGER_ROLE_NAME },
  });
  if (!role) {
    role = await prisma.role.create({
      data: {
        tenantId,
        name: DEPARTMENT_MANAGER_ROLE_NAME,
        description: 'Line manager with team-scoped approvals and reporting',
        isSystem: true,
      },
    });
  }
  await seedDepartmentManagerPermissions(prisma, { tenantId });
}
