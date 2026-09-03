import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppException } from '../../../common/exceptions/app.exception';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';
import {
  ENTITLEMENT_TO_COMPARISON_KEY,
  PLAN_COMPARISON_FEATURE_KEYS,
  type PlanComparisonFeatureKey,
} from '../../../common/constants/plan-comparison.constants';
import { MESSAGE_KEYS } from '../../../common/messages/message-keys.constants';
import { MessageCatalogueService } from '../../../common/messages/message-catalogue.service';
import { RealtimeService } from '../../../realtime/realtime.service';
import { AuditActorType, AuditEventSeverity } from '../../../common/enums/platform.enum';
import { TenantAdminRepository } from '../repositories/tenant-admin.repository';
import type {
  CreateUpgradeRequestDto,
  TenantBrandingResponseDto,
  TenantProfileResponseDto,
  TenantRegionalResponseDto,
  TenantSecurityPolicyResponseDto,
  UpdateTenantBrandingDto,
  UpdateTenantProfileDto,
  UpdateTenantRegionalDto,
  UpdateTenantSecurityPolicyDto,
} from '../dto/tenant-admin.dto';

const CONTRAST_WARNING_KEY = MESSAGE_KEYS.TENANT_CONTRAST_WARNING;

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function parseBoolArray(value: unknown): boolean[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((v) => Boolean(v));
}

function relativeLuminance(hex: string): number {
  const raw = hex.replace('#', '');
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const toLin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const R = toLin(r);
  const G = toLin(g);
  const B = toLin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(a: string, b: string): number {
  const L1 = relativeLuminance(a);
  const L2 = relativeLuminance(b);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

@Injectable()
export class TenantAdminService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimes: string[];

  constructor(
    private readonly repo: TenantAdminRepository,
    private readonly prisma: PrismaService,
    private readonly messages: MessageCatalogueService,
    private readonly realtime: RealtimeService,
    config: ConfigService,
  ) {
    this.uploadDir = config.get<string>('UPLOAD_STORAGE_PATH') ?? join(process.cwd(), 'storage', 'uploads');
    this.maxFileSize = config.get<number>('upload.maxFileSizeBytes') ?? 10_485_760;
    this.allowedMimes = (
      config.get<string[]>('upload.allowedMimeTypes') ?? ['image/jpeg', 'image/png', 'image/webp']
    ).filter((m) => m.startsWith('image/'));
  }

  private emitTenantChange(tenantId: string, type: string, correlationId?: string): void {
    this.realtime.emit({ tenantId, type, resource: 'tenant-admin', correlationId });
  }

  private blockedPayload(key: string): { messageKey: string; message: string } {
    return this.messages.messagePayload(key);
  }

  private setupActionKey(stepKey: string, status: string): string | null {
    if (status === 'unavailable') return null;
    if (status === 'complete') return 'review';
    if (
      stepKey === 'attendance_policy' ||
      stepKey === 'leave_policy' ||
      stepKey === 'payroll_settings' ||
      stepKey === 'notifications' ||
      stepKey === 'integration_setup'
    ) {
      return 'configure';
    }
    if (stepKey === 'employee_import') return 'import';
    if (stepKey === 'validation') return 'validate';
    if (stepKey === 'go_live_readiness') return 'review';
    if (stepKey === 'parallel_payroll') return 'review';
    if (stepKey === 'roles_administrators') return 'setup';
    return 'setup';
  }

  async getProfile(tenantId: string): Promise<TenantProfileResponseDto> {
    const tenant = await this.repo.findTenant(tenantId);
    if (!tenant) {
      throw new AppException({
        code: ERROR_CODES.TENANT_NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.TENANT_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    const settings = tenant.settings;
    return {
      id: tenant.id,
      slug: tenant.slug,
      displayName: tenant.displayName,
      legalName: tenant.legalName,
      countryCode: tenant.countryCode,
      baseCurrency: tenant.baseCurrency,
      defaultTimezone: tenant.defaultTimezone,
      defaultLocale: tenant.defaultLocale,
      registrationNumber: settings?.registrationNumber ?? null,
      industry: settings?.industry ?? null,
      employeeSizeBand: settings?.employeeSizeBand ?? null,
      addressLine1: settings?.addressLine1 ?? null,
      addressLine2: settings?.addressLine2 ?? null,
      city: settings?.city ?? null,
      stateProvince: settings?.stateProvince ?? null,
      postalCode: settings?.postalCode ?? null,
      contactEmail: settings?.contactEmail ?? null,
      contactPhone: settings?.contactPhone ?? null,
      financialYearStart: settings?.financialYearStart ?? null,
      payrollMonthConfig: settings?.payrollMonthConfig ?? null,
      logoUrl: tenant.branding?.logoUrl ?? null,
    };
  }

  async updateProfile(
    tenantId: string,
    dto: UpdateTenantProfileDto,
    actor: { userId: string; email: string },
    correlationId: string,
  ): Promise<TenantProfileResponseDto> {
    await this.prisma.withTenantTransaction(tenantId, async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
          ...(dto.legalName !== undefined ? { legalName: dto.legalName } : {}),
          ...(dto.countryCode !== undefined ? { countryCode: dto.countryCode } : {}),
          ...(dto.baseCurrency !== undefined ? { baseCurrency: dto.baseCurrency } : {}),
          ...(dto.defaultTimezone !== undefined ? { defaultTimezone: dto.defaultTimezone } : {}),
          updatedBy: actor.userId,
          rowVersion: { increment: 1 },
        },
      });

      await this.repo.upsertSettings(
        tenantId,
        {
          tenantId,
          registrationNumber: dto.registrationNumber,
          industry: dto.industry,
          employeeSizeBand: dto.employeeSizeBand,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          city: dto.city,
          stateProvince: dto.stateProvince,
          postalCode: dto.postalCode,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone,
          financialYearStart: dto.financialYearStart,
          payrollMonthConfig: dto.payrollMonthConfig,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        },
        tx,
      );

      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId: actor.userId,
          actorType: AuditActorType.USER,
          actorEmail: actor.email,
          module: 'tenant',
          action: 'tenant.profile.updated',
          resourceType: 'tenant',
          resourceId: tenantId,
          after: { ...dto },
          correlationId,
          severity: AuditEventSeverity.INFO,
        },
      });
    });

    this.emitTenantChange(tenantId, 'tenant.profile.updated', correlationId);
    const profile = await this.getProfile(tenantId);
    return {
      ...profile,
      message: this.messages.resolve(MESSAGE_KEYS.TENANT_PROFILE_UPDATED),
      messageKey: MESSAGE_KEYS.TENANT_PROFILE_UPDATED,
    } as TenantProfileResponseDto & { message: string; messageKey: string };
  }

  async getBranding(tenantId: string): Promise<TenantBrandingResponseDto> {
    const branding = await this.repo.findBranding(tenantId);
    return this.toBrandingDto(tenantId, branding);
  }

  async upsertBranding(
    tenantId: string,
    dto: UpdateTenantBrandingDto,
    actor: { userId: string; email: string },
    correlationId: string,
  ): Promise<TenantBrandingResponseDto> {
    const row = await this.prisma.withTenantTransaction(tenantId, async (tx) => {
      const updated = await this.repo.upsertBranding(
        tenantId,
        {
          logoUrl: dto.logoUrl === undefined ? undefined : dto.logoUrl,
          loginLogoUrl: dto.loginLogoUrl === undefined ? undefined : dto.loginLogoUrl,
          faviconUrl: dto.faviconUrl === undefined ? undefined : dto.faviconUrl,
          primaryColor: dto.primaryColor === undefined ? undefined : dto.primaryColor,
          secondaryColor: dto.secondaryColor === undefined ? undefined : dto.secondaryColor,
          applicationName: dto.applicationName === undefined ? undefined : dto.applicationName,
          emailSenderName: dto.emailSenderName === undefined ? undefined : dto.emailSenderName,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        },
        tx,
      );

      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId: actor.userId,
          actorType: AuditActorType.USER,
          actorEmail: actor.email,
          module: 'tenant',
          action: 'tenant.branding.updated',
          resourceType: 'tenant_branding',
          resourceId: updated.id,
          after: { ...dto },
          correlationId,
          severity: AuditEventSeverity.INFO,
        },
      });

      return updated;
    });

    this.emitTenantChange(tenantId, 'tenant.branding.updated', correlationId);
    const brandingDto = this.toBrandingDto(tenantId, row);
    return {
      ...brandingDto,
      message: this.messages.resolve(MESSAGE_KEYS.TENANT_BRANDING_UPDATED),
      messageKey: MESSAGE_KEYS.TENANT_BRANDING_UPDATED,
    } as TenantBrandingResponseDto & { message: string; messageKey: string };
  }

  async uploadLogo(
    tenantId: string,
    file: { buffer: Buffer; mimetype: string; size: number; originalname: string },
    kind: 'logo' | 'loginLogo' | 'favicon',
    actor: { userId: string; email: string },
    correlationId: string,
  ): Promise<TenantBrandingResponseDto> {
    if (!file) {
      throw new AppException({
        code: ERROR_CODES.INVALID_UPLOAD,
        message: this.messages.resolve(MESSAGE_KEYS.TENANT_UPLOAD_INVALID),
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
    if (!this.allowedMimes.includes(file.mimetype)) {
      throw new AppException({
        code: ERROR_CODES.INVALID_UPLOAD,
        message: this.messages.resolve(MESSAGE_KEYS.TENANT_UPLOAD_INVALID),
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
    if (file.size > this.maxFileSize) {
      throw new AppException({
        code: ERROR_CODES.INVALID_UPLOAD,
        message: this.messages.resolve(MESSAGE_KEYS.TENANT_UPLOAD_TOO_LARGE),
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const dir = join(this.uploadDir, 'tenant-branding', tenantId);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const ext = extname(file.originalname) || '.png';
    const filename = `${kind}-${randomUUID()}${ext}`;
    const absPath = join(dir, filename);
    await pipeline(Readable.from(file.buffer), createWriteStream(absPath));
    const publicUrl = `/uploads/tenant-branding/${tenantId}/${filename}`;

    const patch: UpdateTenantBrandingDto =
      kind === 'loginLogo'
        ? { loginLogoUrl: publicUrl }
        : kind === 'favicon'
          ? { faviconUrl: publicUrl }
          : { logoUrl: publicUrl };

    return this.upsertBranding(tenantId, patch, actor, correlationId);
  }

  async getRegional(tenantId: string): Promise<TenantRegionalResponseDto> {
    const tenant = await this.repo.findTenant(tenantId);
    if (!tenant) {
      throw new AppException({
        code: ERROR_CODES.TENANT_NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.TENANT_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    const settings = tenant.settings;
    return {
      defaultLocale: tenant.defaultLocale,
      enabledLocales: parseStringArray(settings?.enabledLocales) || [tenant.defaultLocale],
      dateFormat: settings?.dateFormat ?? null,
      numberFormat: settings?.numberFormat ?? null,
      currencyDisplay: settings?.currencyDisplay ?? null,
      defaultTimezone: tenant.defaultTimezone,
      weekStart: settings?.weekStart ?? null,
      workingWeekPattern: parseBoolArray(settings?.workingWeekPattern),
    };
  }

  async updateRegional(
    tenantId: string,
    dto: UpdateTenantRegionalDto,
    actor: { userId: string; email: string },
    correlationId: string,
  ): Promise<TenantRegionalResponseDto> {
    await this.prisma.withTenantTransaction(tenantId, async (tx) => {
      if (dto.defaultLocale !== undefined || dto.defaultTimezone !== undefined) {
        await tx.tenant.update({
          where: { id: tenantId },
          data: {
            ...(dto.defaultLocale !== undefined ? { defaultLocale: dto.defaultLocale } : {}),
            ...(dto.defaultTimezone !== undefined ? { defaultTimezone: dto.defaultTimezone } : {}),
            updatedBy: actor.userId,
            rowVersion: { increment: 1 },
          },
        });
      }

      await this.repo.upsertSettings(
        tenantId,
        {
          tenantId,
          dateFormat: dto.dateFormat,
          numberFormat: dto.numberFormat,
          currencyDisplay: dto.currencyDisplay,
          weekStart: dto.weekStart,
          workingWeekPattern: dto.workingWeekPattern ?? undefined,
          enabledLocales: dto.enabledLocales ?? undefined,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        },
        tx,
      );

      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId: actor.userId,
          actorType: AuditActorType.USER,
          actorEmail: actor.email,
          module: 'tenant',
          action: 'tenant.regional.updated',
          resourceType: 'tenant_settings',
          resourceId: tenantId,
          after: { ...dto },
          correlationId,
          severity: AuditEventSeverity.INFO,
        },
      });
    });

    this.emitTenantChange(tenantId, 'tenant.regional.updated', correlationId);
    const regional = await this.getRegional(tenantId);
    return {
      ...regional,
      message: this.messages.resolve(MESSAGE_KEYS.TENANT_REGIONAL_UPDATED),
      messageKey: MESSAGE_KEYS.TENANT_REGIONAL_UPDATED,
    } as TenantRegionalResponseDto & { message: string; messageKey: string };
  }

  async getModules(tenantId: string) {
    const [entitlements, flags, plans] = await Promise.all([
      this.repo.findEntitlements(tenantId),
      this.repo.findFeatureFlags(tenantId),
      this.repo.listPlans(),
    ]);
    const tenant = await this.repo.findTenant(tenantId);
    const enabledKeys = new Set(
      entitlements
        .map((e) => e.entitlement?.code ?? e.entitlementKey)
        .filter((k): k is string => Boolean(k)),
    );
    for (const flag of flags) {
      if (flag.enabled || flag.isEnabled) enabledKeys.add(flag.flagKey || flag.flagKeyLegacy || '');
    }

    const catalogue = [
      { key: 'organisation', label: 'Organisation', description: 'Legal entities, branches, departments', available: true },
      { key: 'employees', label: 'People', description: 'Employee core HR', available: true },
      { key: 'documents', label: 'Documents & Onboarding', description: 'Templates and onboarding journeys', available: true },
      { key: 'attendance', label: 'Attendance', description: 'Time capture and policies', available: true },
      { key: 'shifts', label: 'Shifts & Rosters', description: 'Shift templates and roster publishing', available: true },
      { key: 'leave', label: 'Leave', description: 'Leave policies and requests', available: true },
      { key: 'payroll', label: 'Payroll', description: 'Payroll runs and payslips', available: true },
      { key: 'approvals', label: 'Approvals', description: 'Workflow engine', available: true },
      { key: 'reports', label: 'Reports', description: 'Dashboards and exports', available: true },
      { key: 'integrations', label: 'Integrations', description: 'Connectors and API credentials', available: true },
      { key: 'notifications', label: 'Notifications', description: 'Templates and channels', available: false },
    ];

    return {
      planCode: tenant?.plan?.code ?? tenant?.planKey ?? null,
      planName: tenant?.plan?.name ?? null,
      modules: catalogue.map((m) => {
        const entitled =
          m.available &&
          (enabledKeys.size === 0 ||
            enabledKeys.has(m.key) ||
            enabledKeys.has(`module_${m.key}`) ||
            enabledKeys.has(`feature_${m.key}`));
        const status = !m.available
          ? 'unavailable'
          : entitled
            ? 'active'
            : 'inactive';
        return {
          ...m,
          status,
          planRequirement: m.available ? 'included' : 'upgrade_required',
          dependencies: [] as string[],
          configurePath: m.available ? this.configurePathFor(m.key) : null,
        };
      }),
      availablePlans: plans,
    };
  }

  async getSetupStatus(tenantId: string) {
    const [tenant, counts, branding, settings, securityPolicy, defaultOwner, subscription] = await Promise.all([
      this.repo.findTenant(tenantId),
      this.repo.countSetupSignals(tenantId),
      this.repo.findBranding(tenantId),
      this.repo.findSettings(tenantId),
      this.repo.findSecurityPolicy(tenantId),
      this.resolveDefaultSetupOwner(tenantId),
      this.repo.findActiveSubscription(tenantId),
    ]);
    if (!tenant) {
      throw new AppException({
        code: ERROR_CODES.TENANT_NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.TENANT_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const ownerMap = this.parseSetupOwners(settings?.setupStepOwners);
    const ownerNames = await this.resolveOwnerDisplayNames(ownerMap, defaultOwner);

    const profileComplete = Boolean(
      tenant.displayName &&
        tenant.legalName &&
        tenant.countryCode &&
        (settings?.contactEmail || settings?.registrationNumber),
    );
    const orgComplete = counts.legalEntities > 0 && (counts.branches > 0 || counts.departments > 0);
    const locationsComplete = counts.branches > 0;
    const adminsComplete = counts.admins > 0;
    const rolesInProgress = !adminsComplete && counts.pendingInvites > 0;
    const attendanceComplete = counts.attendancePolicies > 0;
    const leaveComplete = counts.leaveTypes > 0;
    const payrollComplete = Boolean(settings?.payrollMonthConfig) || counts.payrollGroups > 0;
    const employeesComplete = counts.employees > 0;
    const notificationsComplete = Boolean(securityPolicy);
    const integrationsComplete = counts.activeIntegrations > 0;
    const policiesConfigured = counts.attendancePolicies + counts.leaveTypes;
    const policyTarget = 5;

    const parallelPrereqs = {
      attendanceLocked: attendanceComplete,
      payrollConfigured: payrollComplete,
      employeeData: employeesComplete,
      payrollGroupSetup: counts.payrollGroups > 0,
    };
    const parallelComplete =
      parallelPrereqs.attendanceLocked &&
      parallelPrereqs.payrollConfigured &&
      parallelPrereqs.employeeData &&
      parallelPrereqs.payrollGroupSetup;

    const policiesOk = attendanceComplete && leaveComplete;
    const validationComplete = profileComplete && orgComplete && adminsComplete && policiesOk;
    const goLiveComplete =
      validationComplete && attendanceComplete && parallelComplete && integrationsComplete;

    const rawSteps: Array<{
      key: string;
      required: boolean;
      status: string;
      href: string | null;
      blockedReason: { messageKey: string; message: string } | null;
      requirements?: string[];
    }> = [
      {
        key: 'company_profile',
        required: true,
        status: profileComplete ? 'complete' : 'incomplete',
        href: '/settings/company',
        blockedReason: null,
      },
      {
        key: 'organisation',
        required: true,
        status: orgComplete ? 'complete' : 'incomplete',
        href: '/organisation',
        blockedReason: null,
      },
      {
        key: 'locations',
        required: true,
        status: locationsComplete ? 'complete' : 'incomplete',
        href: '/organisation/branches',
        blockedReason: null,
      },
      {
        key: 'roles_administrators',
        required: true,
        status: adminsComplete ? 'complete' : rolesInProgress ? 'in_progress' : 'incomplete',
        href: '/settings/users',
        blockedReason: null,
      },
      {
        key: 'attendance_policy',
        required: true,
        status: attendanceComplete ? 'complete' : 'incomplete',
        href: '/attendance/policies',
        blockedReason: null,
      },
      {
        key: 'leave_policy',
        required: true,
        status: leaveComplete ? 'complete' : 'incomplete',
        href: '/leave/types',
        blockedReason: null,
      },
      {
        key: 'payroll_settings',
        required: true,
        status: payrollComplete ? 'complete' : 'incomplete',
        href: '/settings/payroll-calendar',
        blockedReason: null,
      },
      {
        key: 'employee_import',
        required: true,
        status: employeesComplete ? 'complete' : 'incomplete',
        href: '/employees/import',
        blockedReason: null,
      },
      {
        key: 'notifications',
        required: false,
        status: notificationsComplete ? 'complete' : 'incomplete',
        href: '/settings/security',
        blockedReason: null,
      },
      {
        key: 'integration_setup',
        required: false,
        status: integrationsComplete ? 'complete' : 'incomplete',
        href: '/integrations',
        blockedReason: null,
      },
      {
        key: 'parallel_payroll',
        required: true,
        status: parallelComplete ? 'complete' : 'incomplete',
        href: '/payroll',
        blockedReason: null,
        requirements: [
          parallelPrereqs.attendanceLocked ? 'attendance_locked' : 'attendance_pending',
          parallelPrereqs.payrollConfigured ? 'payroll_configured' : 'payroll_pending',
          parallelPrereqs.employeeData ? 'employee_data' : 'employee_pending',
          parallelPrereqs.payrollGroupSetup ? 'payroll_group' : 'payroll_group_pending',
        ],
      },
      {
        key: 'validation',
        required: true,
        status: validationComplete ? 'complete' : policiesOk ? 'incomplete' : 'blocked',
        href: '/settings',
        blockedReason: policiesOk ? null : this.blockedPayload(MESSAGE_KEYS.SETUP_BLOCKED_POLICIES),
      },
      {
        key: 'go_live_readiness',
        required: true,
        status: goLiveComplete ? 'complete' : validationComplete ? 'incomplete' : 'blocked',
        href: '/dashboard',
        blockedReason: validationComplete
          ? null
          : this.blockedPayload(MESSAGE_KEYS.SETUP_BLOCKED_REQUIREMENTS),
      },
    ];

    const steps = rawSteps.map((s, index) => ({
      sequence: index + 1,
      key: s.key,
      required: s.required,
      status: s.status,
      href: s.href,
      blockedReason: s.blockedReason,
      requirements: s.requirements ?? [],
      actionKey: this.setupActionKey(s.key, s.status),
      ownerUserId: ownerMap[s.key] ?? defaultOwner?.userId ?? null,
      ownerDisplayName: ownerNames[s.key] ?? defaultOwner?.displayName ?? '—',
    }));

    const actionable = steps.filter((s) => s.status !== 'unavailable');
    const completed = actionable.filter((s) => s.status === 'complete').length;
    const percentComplete =
      actionable.length === 0 ? 0 : Math.round((completed / actionable.length) * 100);
    const requiredIncomplete = steps.filter((s) => s.required && s.status !== 'complete');
    const goLiveReady = requiredIncomplete.length === 0;
    const nextIncomplete = steps.find((s) => s.status !== 'complete' && s.href && s.status !== 'blocked');
    const seatLimit = tenant.seatLimit ?? null;
    const activeEmployees = counts.employees;
    const seatPercent =
      seatLimit != null && seatLimit > 0 ? Math.round((activeEmployees / seatLimit) * 100) : null;

    const trialExpired =
      (subscription?.status === 'TRIAL' || subscription?.status === 'TRIALING') &&
      subscription.trialEndsAt != null &&
      subscription.trialEndsAt.getTime() < Date.now();

    return {
      percentComplete,
      goLiveReady,
      completed,
      total: actionable.length,
      trialExpired,
      supportIntervention: false,
      steps,
      summary: {
        seatUsage: {
          active: activeEmployees,
          limit: seatLimit,
          percent: seatPercent,
        },
        policyCount: policiesConfigured,
        policyTarget,
        readinessCount: completed,
        readinessTarget: steps.length,
        remainingCount: steps.length - completed,
        nextStepKey: nextIncomplete?.key ?? null,
        nextStepHref: nextIncomplete?.href ?? null,
        nextStepLabel: nextIncomplete?.key ?? null,
      },
      implementationCalendar: this.buildImplementationCalendar(steps),
      categories: [
        { key: 'company', href: '/settings/company', complete: profileComplete },
        { key: 'organisation', href: '/organisation', complete: orgComplete },
        { key: 'users_roles', href: '/settings/users', complete: adminsComplete },
        { key: 'attendance', href: '/attendance/policies', complete: attendanceComplete },
        { key: 'regional', href: '/settings/regional', complete: Boolean(settings?.dateFormat) },
        { key: 'branding', href: '/settings/branding', complete: Boolean(branding?.logoUrl || branding?.primaryColor) },
        { key: 'modules', href: '/settings/modules', complete: true },
        { key: 'security', href: '/settings/security', complete: Boolean(securityPolicy) },
        { key: 'subscription', href: '/subscription', complete: Boolean(tenant.planId || tenant.planKey) },
        { key: 'leave', href: '/leave/types', complete: leaveComplete },
        { key: 'payroll', href: '/settings/payroll-calendar', complete: payrollComplete },
        { key: 'workflows', href: '/approvals/workflows', complete: false },
        { key: 'notifications', href: '/settings/security', complete: notificationsComplete },
        { key: 'integrations', href: '/integrations', complete: integrationsComplete },
      ],
    };
  }

  async assignSetupStepOwners(
    tenantId: string,
    assignments: Record<string, string>,
    actorId: string,
  ) {
    await this.repo.updateSetupStepOwners(tenantId, assignments, actorId);
    return this.getSetupStatus(tenantId);
  }

  private parseSetupOwners(raw: unknown): Record<string, string> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === 'string' && v) out[k] = v;
    }
    return out;
  }

  private async resolveDefaultSetupOwner(tenantId: string) {
    const assignment = await this.prisma.roleAssignment.findFirst({
      where: {
        tenantId,
        role: { name: { equals: 'Tenant Admin', mode: 'insensitive' } },
      },
      include: { user: { select: { id: true, displayName: true, displayNameLegacy: true } } },
      orderBy: { grantedAt: 'asc' },
    });
    if (!assignment?.user) return null;
    return {
      userId: assignment.user.id,
      displayName:
        assignment.user.displayName ??
        assignment.user.displayNameLegacy ??
        'Tenant Admin',
    };
  }

  private async resolveOwnerDisplayNames(
    ownerMap: Record<string, string>,
    defaultOwner: { userId: string; displayName: string } | null,
  ): Promise<Record<string, string>> {
    const ids = [...new Set(Object.values(ownerMap))];
    if (defaultOwner?.userId) ids.push(defaultOwner.userId);
    const users = ids.length
      ? await this.prisma.appUser.findMany({
          where: { id: { in: ids } },
          select: { id: true, displayName: true, displayNameLegacy: true },
        })
      : [];
    const byId = new Map(
      users.map((u) => [
        u.id,
        u.displayName ?? u.displayNameLegacy ?? 'User',
      ]),
    );
    const names: Record<string, string> = {};
    for (const [stepKey, userId] of Object.entries(ownerMap)) {
      names[stepKey] = byId.get(userId) ?? defaultOwner?.displayName ?? '—';
    }
    return names;
  }

  private buildImplementationCalendar(
    steps: Array<{ key: string; status: string }>,
  ) {
    const byKey = new Map(steps.map((s) => [s.key, s.status]));
    const weeks = [
      {
        key: 'week1',
        labelKey: 'week1',
        stepKeys: ['company_profile', 'organisation', 'locations'],
      },
      {
        key: 'week2',
        labelKey: 'week2',
        stepKeys: ['attendance_policy', 'leave_policy', 'payroll_settings'],
      },
      {
        key: 'week3',
        labelKey: 'week3',
        stepKeys: ['employee_import', 'roles_administrators', 'notifications'],
      },
      {
        key: 'week4',
        labelKey: 'week4',
        stepKeys: [
          'integration_setup',
          'parallel_payroll',
          'validation',
          'go_live_readiness',
        ],
      },
    ];
    return weeks.map((week) => {
      const statuses = week.stepKeys.map((k) => byKey.get(k) ?? 'incomplete');
      const done = statuses.filter((s) => s === 'complete').length;
      const percent = week.stepKeys.length === 0 ? 0 : Math.round((done / week.stepKeys.length) * 100);
      return {
        ...week,
        percent,
        stepKeys: week.stepKeys,
        stepStatuses: Object.fromEntries(week.stepKeys.map((k, i) => [k, statuses[i]])),
      };
    });
  }

  async getSubscription(tenantId: string) {
    const tenant = await this.repo.findTenant(tenantId);
    if (!tenant) {
      throw new AppException({
        code: ERROR_CODES.TENANT_NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.TENANT_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    const sub = await this.repo.findActiveSubscription(tenantId);
    const modules = await this.getModules(tenantId);
    return {
      planId: tenant.planId ?? sub?.planId ?? null,
      planCode: tenant.plan?.code ?? tenant.planKey ?? sub?.planKey ?? null,
      planName: tenant.plan?.name ?? sub?.plan?.name ?? null,
      billingCycle: sub?.billingCycle ?? null,
      seatLimit: tenant.seatLimit ?? sub?.seatLimit ?? null,
      status: tenant.status,
      subscriptionStatus: sub?.status ?? null,
      startsOn: sub?.startsOn?.toISOString().slice(0, 10) ?? null,
      endsOn: sub?.endsOn?.toISOString().slice(0, 10) ?? null,
      trialEndsAt: sub?.trialEndsAt?.toISOString() ?? null,
      enabledModules: modules.modules.filter((m) => m.status === 'active').map((m) => m.key),
      supportTier: null as string | null,
    };
  }

  async getUsage(tenantId: string) {
    const tenant = await this.repo.findTenant(tenantId);
    if (!tenant) {
      throw new AppException({
        code: ERROR_CODES.TENANT_NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.TENANT_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    const snapshot = await this.repo.findLatestUsage(tenantId);
    const liveEmployees = await this.prisma.employee.count({ where: { tenantId } });
    const invitedUsers = await this.prisma.userInvitation.count({
      where: { tenantId, acceptedAt: null },
    });
    const seatLimit = tenant.seatLimit ?? null;
    const activeEmployees = snapshot?.activeEmployees ?? liveEmployees;
    const approaching =
      seatLimit != null && seatLimit > 0 ? activeEmployees / seatLimit >= 0.8 : false;
    const reached = seatLimit != null ? activeEmployees >= seatLimit : false;

    return {
      snapshotDate: snapshot?.snapshotDate?.toISOString().slice(0, 10) ?? null,
      activeEmployees,
      totalEmployees: snapshot?.totalEmployees ?? liveEmployees,
      invitedUsers,
      seatLimit,
      storageUsedBytes: snapshot ? Number(snapshot.storageUsedBytes) : 0,
      apiCallsMonth: snapshot?.apiCallsMonth ?? 0,
      integrationEventVolume: snapshot?.integrationEventVolume ?? 0,
      exportVolume: snapshot?.exportVolume ?? 0,
      warnings: {
        approachingSeatLimit: approaching && !reached,
        seatLimitReached: reached,
        overagePolicyKey: reached ? 'tenant.usage.overage.reached' : null,
      },
    };
  }

  async comparePlans(tenantId: string) {
    const tenant = await this.repo.findTenant(tenantId);
    if (!tenant) {
      throw new AppException({
        code: ERROR_CODES.TENANT_NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.TENANT_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const plans = await this.repo.findPlansWithEntitlements();
    const currentPlanId = tenant.planId ?? null;

    return {
      currentPlanId,
      currentPlanCode: tenant.plan?.code ?? tenant.planKey ?? null,
      features: PLAN_COMPARISON_FEATURE_KEYS,
      plans: plans.map((plan) => ({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        isCurrent: plan.id === currentPlanId,
        featureStates: this.buildPlanFeatureStates(plan.planEntitlements),
      })),
    };
  }

  private buildPlanFeatureStates(
    planEntitlements: Array<{
      defaultValue: unknown;
      entitlement: { code: string; dataType: string };
    }>,
  ): Record<PlanComparisonFeatureKey, string> {
    const entitlementMap = new Map<string, unknown>();
    for (const pe of planEntitlements) {
      entitlementMap.set(pe.entitlement.code, pe.defaultValue);
    }

    const states = {} as Record<PlanComparisonFeatureKey, string>;
    for (const featureKey of PLAN_COMPARISON_FEATURE_KEYS) {
      const entitlementCode = Object.entries(ENTITLEMENT_TO_COMPARISON_KEY).find(
        ([, v]) => v === featureKey,
      )?.[0];
      if (!entitlementCode) {
        states[featureKey] = 'unavailable';
        continue;
      }
      const raw = entitlementMap.get(entitlementCode);
      if (raw === undefined || raw === null) {
        states[featureKey] = 'unavailable';
        continue;
      }
      if (typeof raw === 'boolean') {
        states[featureKey] = raw ? 'included' : 'unavailable';
        continue;
      }
      if (typeof raw === 'number') {
        states[featureKey] = raw > 0 ? 'included' : 'limited';
        continue;
      }
      if (typeof raw === 'string') {
        const normalized = raw.toLowerCase();
        if (normalized === 'included' || normalized === 'optional' || normalized === 'limited') {
          states[featureKey] = normalized;
        } else {
          states[featureKey] = raw ? 'included' : 'unavailable';
        }
        continue;
      }
      states[featureKey] = 'included';
    }
    return states;
  }

  async createUpgradeRequest(
    tenantId: string,
    dto: CreateUpgradeRequestDto,
    actor: { userId: string; email: string },
    correlationId: string,
  ) {
    if (!dto.requestedPlanId && !dto.requestedPlanKey) {
      throw new AppException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: this.messages.resolve(MESSAGE_KEYS.UPGRADE_PLAN_REQUIRED),
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const created = await this.prisma.withTenantTransaction(tenantId, async (tx) => {
      const row = await this.repo.createUpgradeRequest(
        {
          tenantId,
          requestedPlanId: dto.requestedPlanId,
          requestedPlanKey: dto.requestedPlanKey,
          additionalSeats: dto.additionalSeats,
          additionalModuleKeys: dto.additionalModuleKeys ?? undefined,
          requestedEffectiveDate: dto.requestedEffectiveDate
            ? new Date(dto.requestedEffectiveDate)
            : undefined,
          contactPersonName: dto.contactPersonName,
          businessReason: dto.businessReason ?? dto.note,
          note: dto.note,
          billingContactEmail: dto.billingContactEmail,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        },
        tx,
      );

      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId: actor.userId,
          actorType: AuditActorType.USER,
          actorEmail: actor.email,
          module: 'tenant',
          action: 'tenant.upgrade_request.created',
          resourceType: 'tenant_upgrade_request',
          resourceId: row.id,
          after: {
            requestedPlanId: row.requestedPlanId,
            requestedPlanKey: row.requestedPlanKey,
          },
          correlationId,
          severity: AuditEventSeverity.INFO,
        },
      });

      return row;
    });

    this.emitTenantChange(tenantId, 'tenant.upgrade_request.created', correlationId);

    return {
      id: created.id,
      status: created.status,
      requestedPlanId: created.requestedPlanId,
      requestedPlanKey: created.requestedPlanKey,
      additionalSeats: created.additionalSeats,
      additionalModuleKeys: created.additionalModuleKeys,
      requestedEffectiveDate: created.requestedEffectiveDate
        ? created.requestedEffectiveDate.toISOString().slice(0, 10)
        : null,
      contactPersonName: created.contactPersonName,
      businessReason: created.businessReason,
      note: created.note,
      billingContactEmail: created.billingContactEmail,
      createdAt: created.createdAt.toISOString(),
      message: this.messages.resolve(MESSAGE_KEYS.TENANT_UPGRADE_CREATED),
      messageKey: MESSAGE_KEYS.TENANT_UPGRADE_CREATED,
    };
  }

  async listUpgradeRequests(tenantId: string) {
    const rows = await this.repo.listUpgradeRequests(tenantId);
    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      requestedPlanId: r.requestedPlanId,
      requestedPlanKey: r.requestedPlanKey,
      planName: r.plan?.name ?? null,
      additionalSeats: r.additionalSeats,
      additionalModuleKeys: r.additionalModuleKeys,
      requestedEffectiveDate: r.requestedEffectiveDate
        ? r.requestedEffectiveDate.toISOString().slice(0, 10)
        : null,
      contactPersonName: r.contactPersonName,
      businessReason: r.businessReason,
      note: r.note,
      billingContactEmail: r.billingContactEmail,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getSecurityPolicy(tenantId: string): Promise<TenantSecurityPolicyResponseDto> {
    let policy = await this.repo.findSecurityPolicy(tenantId);
    if (!policy) {
      policy = await this.repo.upsertSecurityPolicy(tenantId, {});
    }
    return this.toSecurityDto(policy);
  }

  async updateSecurityPolicy(
    tenantId: string,
    dto: UpdateTenantSecurityPolicyDto,
    actor: { userId: string; email: string },
    correlationId: string,
  ): Promise<TenantSecurityPolicyResponseDto> {
    const updated = await this.prisma.withTenantTransaction(tenantId, async (tx) => {
      const row = await this.repo.upsertSecurityPolicy(
        tenantId,
        {
          ...(dto.passwordMinLength !== undefined
            ? { passwordMinLength: dto.passwordMinLength }
            : {}),
          ...(dto.passwordRequireUpper !== undefined
            ? { passwordRequireUpper: dto.passwordRequireUpper }
            : {}),
          ...(dto.passwordRequireLower !== undefined
            ? { passwordRequireLower: dto.passwordRequireLower }
            : {}),
          ...(dto.passwordRequireDigit !== undefined
            ? { passwordRequireDigit: dto.passwordRequireDigit }
            : {}),
          ...(dto.passwordRequireSymbol !== undefined
            ? { passwordRequireSymbol: dto.passwordRequireSymbol }
            : {}),
          ...(dto.mfaRequiredForAdmins !== undefined
            ? { mfaRequiredForAdmins: dto.mfaRequiredForAdmins }
            : {}),
          ...(dto.sessionTtlHours !== undefined ? { sessionTtlHours: dto.sessionTtlHours } : {}),
          ...(dto.maxLoginAttempts !== undefined ? { maxLoginAttempts: dto.maxLoginAttempts } : {}),
          ...(dto.trustedEmailDomains !== undefined
            ? { trustedEmailDomains: dto.trustedEmailDomains }
            : {}),
          createdBy: actor.userId,
          updatedBy: actor.userId,
        },
        tx,
      );

      await tx.auditEvent.create({
        data: {
          tenantId,
          actorId: actor.userId,
          actorType: AuditActorType.USER,
          actorEmail: actor.email,
          module: 'tenant',
          action: 'tenant.security_policy.updated',
          resourceType: 'tenant_security_policy',
          resourceId: row.id,
          after: { ...dto },
          correlationId,
          severity: AuditEventSeverity.WARNING,
        },
      });

      return row;
    });

    this.emitTenantChange(tenantId, 'tenant.security_policy.updated', correlationId);
    const dtoResult = this.toSecurityDto(updated);
    return {
      ...dtoResult,
      message: this.messages.resolve(MESSAGE_KEYS.TENANT_SECURITY_UPDATED),
      messageKey: MESSAGE_KEYS.TENANT_SECURITY_UPDATED,
    } as TenantSecurityPolicyResponseDto & { message: string; messageKey: string };
  }

  private toBrandingDto(
    tenantId: string,
    branding: {
      logoUrl: string | null;
      loginLogoUrl?: string | null;
      faviconUrl: string | null;
      primaryColor: string | null;
      secondaryColor?: string | null;
      applicationName?: string | null;
      emailSenderName?: string | null;
    } | null,
  ): TenantBrandingResponseDto {
    const warnings: string[] = [];
    const primary = branding?.primaryColor;
    if (primary && contrastRatio(primary, '#FFFFFF') < 4.5) {
      warnings.push(this.messages.resolve(CONTRAST_WARNING_KEY));
    }
    return {
      tenantId,
      logoUrl: branding?.logoUrl ?? null,
      loginLogoUrl: branding?.loginLogoUrl ?? null,
      faviconUrl: branding?.faviconUrl ?? null,
      primaryColor: branding?.primaryColor ?? null,
      secondaryColor: branding?.secondaryColor ?? null,
      applicationName: branding?.applicationName ?? null,
      emailSenderName: branding?.emailSenderName ?? null,
      contrastWarnings: warnings,
    };
  }

  private toSecurityDto(policy: {
    passwordMinLength: number;
    passwordRequireUpper: boolean;
    passwordRequireLower: boolean;
    passwordRequireDigit: boolean;
    passwordRequireSymbol: boolean;
    mfaRequiredForAdmins: boolean;
    sessionTtlHours: number;
    maxLoginAttempts: number;
    trustedEmailDomains: unknown;
  }): TenantSecurityPolicyResponseDto {
    return {
      passwordMinLength: policy.passwordMinLength,
      passwordRequireUpper: policy.passwordRequireUpper,
      passwordRequireLower: policy.passwordRequireLower,
      passwordRequireDigit: policy.passwordRequireDigit,
      passwordRequireSymbol: policy.passwordRequireSymbol,
      mfaRequiredForAdmins: policy.mfaRequiredForAdmins,
      sessionTtlHours: policy.sessionTtlHours,
      maxLoginAttempts: policy.maxLoginAttempts,
      trustedEmailDomains: parseStringArray(policy.trustedEmailDomains),
    };
  }

  private configurePathFor(key: string): string | null {
    switch (key) {
      case 'organisation':
        return '/organisation';
      case 'employees':
        return '/employees';
      case 'documents':
        return '/documents';
      case 'attendance':
        return '/attendance';
      case 'shifts':
        return '/shifts';
      default:
        return null;
    }
  }
}
