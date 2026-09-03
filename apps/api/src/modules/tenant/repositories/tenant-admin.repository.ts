import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';

@Injectable()
export class TenantAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTenant(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branding: true,
        settings: true,
        securityPolicy: true,
        plan: { select: { id: true, code: true, name: true, description: true } },
      },
    });
  }

  findSettings(tenantId: string) {
    return this.prisma.tenantSettings.findUnique({ where: { tenantId } });
  }

  findBranding(tenantId: string) {
    return this.prisma.tenantBranding.findUnique({ where: { tenantId } });
  }

  findSecurityPolicy(tenantId: string) {
    return this.prisma.tenantSecurityPolicy.findUnique({ where: { tenantId } });
  }

  findLatestUsage(tenantId: string) {
    return this.prisma.tenantUsageSnapshot.findFirst({
      where: { tenantId },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  findActiveSubscription(tenantId: string) {
    return this.prisma.tenantSubscription.findFirst({
      where: {
        tenantId,
        status: { in: ['ACTIVE', 'TRIAL', 'TRIALING', 'GRACE', 'PAST_DUE'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: { select: { id: true, code: true, name: true, description: true } },
      },
    });
  }

  findEntitlements(tenantId: string) {
    return this.prisma.tenantEntitlement.findMany({
      where: {
        tenantId,
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }],
      },
      include: {
        entitlement: {
          select: { id: true, code: true, label: true, description: true, dataType: true },
        },
      },
    });
  }

  findFeatureFlags(tenantId: string) {
    return this.prisma.tenantFeatureFlag.findMany({
      where: {
        tenantId,
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }],
      },
    });
  }

  async countSetupSignals(tenantId: string) {
    const [
      legalEntities,
      branches,
      departments,
      admins,
      attendancePolicies,
      employees,
      leaveTypes,
      payrollGroups,
      activeIntegrations,
      pendingInvites,
    ] = await Promise.all([
      this.prisma.legalEntity.count({ where: { tenantId } }),
      this.prisma.branch.count({ where: { tenantId } }),
      this.prisma.department.count({ where: { tenantId } }),
      this.prisma.roleAssignment.count({
        where: {
          tenantId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          role: { name: { equals: 'Tenant Admin', mode: 'insensitive' } },
        },
      }),
      this.prisma.attendancePolicy.count({ where: { tenantId } }),
      this.prisma.employee.count({ where: { tenantId } }),
      this.prisma.leaveType.count({ where: { tenantId } }),
      this.prisma.payrollGroup.count({ where: { tenantId } }),
      this.prisma.tenantIntegration.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.userInvitation.count({
        where: {
          tenantId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);
    return {
      legalEntities,
      branches,
      departments,
      admins,
      attendancePolicies,
      employees,
      leaveTypes,
      payrollGroups,
      activeIntegrations,
      pendingInvites,
    };
  }

  async updateSetupStepOwners(
    tenantId: string,
    assignments: Record<string, string>,
    actorId: string,
  ) {
    const owners = Object.fromEntries(
      Object.entries(assignments).filter(([k, v]) => k && v),
    );
    return this.upsertSettings(tenantId, {
      tenantId,
      setupStepOwners: owners,
      createdBy: actorId,
      updatedBy: actorId,
    });
  }

  upsertSettings(
    tenantId: string,
    data: Prisma.TenantSettingsUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.tenantSettings.upsert({
      where: { tenantId },
      create: data,
      update: { ...data, tenantId: undefined },
    });
  }

  upsertBranding(
    tenantId: string,
    data: Omit<Prisma.TenantBrandingUncheckedCreateInput, 'tenantId'>,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.tenantBranding.upsert({
      where: { tenantId },
      create: { tenantId, ...data },
      update: data,
    });
  }

  upsertSecurityPolicy(
    tenantId: string,
    data: Omit<Prisma.TenantSecurityPolicyUncheckedCreateInput, 'tenantId'>,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.tenantSecurityPolicy.upsert({
      where: { tenantId },
      create: { tenantId, ...data },
      update: data,
    });
  }

  createUpgradeRequest(
    data: Prisma.TenantUpgradeRequestUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.tenantUpgradeRequest.create({ data });
  }

  listUpgradeRequests(tenantId: string) {
    return this.prisma.tenantUpgradeRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        plan: { select: { id: true, code: true, name: true } },
      },
    });
  }

  listPlans() {
    return this.prisma.plan.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, description: true },
    });
  }

  findPlansWithEntitlements() {
    return this.prisma.plan.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
      include: {
        planEntitlements: {
          include: {
            entitlement: { select: { id: true, code: true, dataType: true, label: true } },
          },
        },
      },
    });
  }
}
