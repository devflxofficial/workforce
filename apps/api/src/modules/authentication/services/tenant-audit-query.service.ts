import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppException } from '../../../common/exceptions/app.exception';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';
import { MESSAGE_KEYS } from '../../../common/messages/message-keys.constants';
import { MessageCatalogueService } from '../../../common/messages/message-catalogue.service';
import { createPaginatedResponse } from '../../../common/utils/response.helper';
import { toPrismaSkipTake } from '../../../common/utils/pagination.helper';

export interface ListAuditQuery {
  page?: number;
  pageSize?: number;
  module?: string;
  action?: string;
  actorId?: string;
  severity?: string;
  fromDate?: string;
  toDate?: string;
}

@Injectable()
export class TenantAuditQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messages: MessageCatalogueService,
  ) {}

  async summary(tenantId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const baseWhere: Prisma.AuditEventWhereInput = {
      tenantId,
      occurredAt: { gte: since },
    };

    const [
      sensitiveChanges,
      roleChanges,
      payrollActions,
      attendanceChanges,
      failedLogins,
      supportAccess,
      dataExports,
    ] = await Promise.all([
      this.prisma.auditEvent.count({
        where: { ...baseWhere, severity: { in: ['WARNING', 'CRITICAL'] } },
      }),
      this.prisma.auditEvent.count({
        where: { ...baseWhere, action: { contains: 'role', mode: 'insensitive' } },
      }),
      this.prisma.auditEvent.count({
        where: { ...baseWhere, module: 'payroll' },
      }),
      this.prisma.auditEvent.count({
        where: { ...baseWhere, module: 'attendance' },
      }),
      this.prisma.auditEvent.count({
        where: {
          ...baseWhere,
          action: { contains: 'login.failed', mode: 'insensitive' },
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          ...baseWhere,
          action: { contains: 'support', mode: 'insensitive' },
        },
      }),
      this.prisma.auditEvent.count({
        where: {
          ...baseWhere,
          action: { contains: 'export', mode: 'insensitive' },
        },
      }),
    ]);

    return {
      windowDays: 30,
      widgets: {
        sensitiveChanges,
        roleChanges,
        payrollActions,
        attendanceChanges,
        failedLogins,
        supportAccess,
        dataExports,
      },
    };
  }

  async list(tenantId: string, query: ListAuditQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = toPrismaSkipTake({ page, pageSize });

    const where: Prisma.AuditEventWhereInput = {
      tenantId,
      ...(query.module ? { module: query.module } : {}),
      ...(query.action ? { action: { contains: query.action, mode: 'insensitive' } } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.fromDate || query.toDate
        ? {
            occurredAt: {
              ...(query.fromDate ? { gte: new Date(`${query.fromDate}T00:00:00.000Z`) } : {}),
              ...(query.toDate ? { lte: new Date(`${query.toDate}T23:59:59.999Z`) } : {}),
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.auditEvent.count({ where }),
      this.prisma.auditEvent.findMany({
        where,
        skip,
        take,
        orderBy: { occurredAt: 'desc' },
        select: {
          id: true,
          actorId: true,
          actorEmail: true,
          module: true,
          action: true,
          resourceType: true,
          resourceId: true,
          severity: true,
          occurredAt: true,
          correlationId: true,
        },
      }),
    ]);

    return createPaginatedResponse(
      rows.map((r) => ({
        ...r,
        occurredAt: r.occurredAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  async getById(tenantId: string, id: string) {
    const row = await this.prisma.auditEvent.findFirst({
      where: { id, tenantId },
    });
    if (!row) {
      throw new AppException({
        code: ERROR_CODES.AUDIT_EVENT_NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.AUDIT_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const related = await this.prisma.auditEvent.findMany({
      where: {
        tenantId,
        correlationId: row.correlationId,
        id: { not: row.id },
      },
      orderBy: { occurredAt: 'asc' },
      take: 20,
      select: {
        id: true,
        action: true,
        module: true,
        occurredAt: true,
        severity: true,
      },
    });

    return {
      id: row.id,
      tenantId: row.tenantId,
      actorId: row.actorId,
      actorType: row.actorType,
      actorEmail: row.actorEmail,
      module: row.module,
      action: row.action,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      before: this.maskSensitive(row.before),
      after: this.maskSensitive(row.after),
      metadata: row.metadata,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      severity: row.severity,
      occurredAt: row.occurredAt.toISOString(),
      correlationId: row.correlationId,
      relatedEvents: related.map((e) => ({
        id: e.id,
        action: e.action,
        module: e.module,
        severity: e.severity,
        occurredAt: e.occurredAt.toISOString(),
      })),
    };
  }

  private maskSensitive(value: unknown): unknown {
    if (!value || typeof value !== 'object') return value;
    const obj = value as Record<string, unknown>;
    const masked: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('password') ||
        lower.includes('token') ||
        lower.includes('secret') ||
        lower.includes('hash')
      ) {
        masked[key] = '[masked]';
      } else {
        masked[key] = val;
      }
    }
    return masked;
  }
}
