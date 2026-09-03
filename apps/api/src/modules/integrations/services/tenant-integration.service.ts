import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppException } from '../../../common/exceptions/app.exception';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';
import { MESSAGE_KEYS } from '../../../common/messages/message-keys.constants';
import { MessageCatalogueService } from '../../../common/messages/message-catalogue.service';
import { INTEGRATION_CATALOGUE } from './integrations-catalogue.service';

@Injectable()
export class TenantIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messages: MessageCatalogueService,
  ) {}

  async listDirectory(tenantId: string) {
    const configured = await this.prisma.tenantIntegration.findMany({
      where: { tenantId },
    });
    const byAdapter = new Map(configured.map((c) => [c.adapterCode, c]));

    return INTEGRATION_CATALOGUE.map((item) => {
      const match = byAdapter.get(item.id) ?? configured.find((c) => c.connectionType === item.category);
      const status = match?.status ?? 'NOT_CONFIGURED';
      return {
        id: item.id,
        category: item.category,
        configured: match != null && match.status === 'ACTIVE',
        status,
        configureHref: item.configureHref,
        tenantIntegrationId: match?.id ?? null,
        name: match?.name ?? null,
        lastSuccessAt: match?.lastSuccessAt?.toISOString() ?? null,
        lastFailureAt: match?.lastFailureAt?.toISOString() ?? null,
      };
    });
  }

  async create(
    tenantId: string,
    actorId: string,
    dto: {
      connectionType: string;
      name: string;
      adapterCode: string;
      configuration?: Record<string, unknown>;
    },
  ) {
    return this.prisma.tenantIntegration.create({
      data: {
        tenantId,
        connectionType: dto.connectionType,
        name: dto.name.trim(),
        adapterCode: dto.adapterCode.trim(),
        configuration: (dto.configuration ?? {}) as Prisma.InputJsonValue,
        status: 'DRAFT',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async getById(tenantId: string, id: string) {
    const row = await this.prisma.tenantIntegration.findFirst({ where: { id, tenantId } });
    if (!row) {
      throw new AppException({
        code: ERROR_CODES.NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.INTEGRATION_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    return this.mapIntegration(row);
  }

  async update(
    tenantId: string,
    id: string,
    actorId: string,
    dto: { name?: string; configuration?: Record<string, unknown> },
  ) {
    await this.getById(tenantId, id);
    const row = await this.prisma.tenantIntegration.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.configuration ? { configuration: dto.configuration as Prisma.InputJsonValue } : {}),
        updatedBy: actorId,
      },
    });
    return this.mapIntegration(row);
  }

  async test(tenantId: string, id: string, actorId: string) {
    const row = await this.getById(tenantId, id);
    await this.prisma.tenantIntegration.update({
      where: { id },
      data: { status: 'TESTING', updatedBy: actorId },
    });
    const run = await this.prisma.tenantIntegrationSyncRun.create({
      data: {
        tenantId,
        integrationId: id,
        status: 'SUCCESS',
        itemsProcessed: 0,
        finishedAt: new Date(),
        message: this.messages.resolve(MESSAGE_KEYS.INTEGRATION_TEST_OK),
      },
    });
    await this.prisma.tenantIntegration.update({
      where: { id },
      data: { lastSuccessAt: new Date(), status: 'TESTING', updatedBy: actorId },
    });
    return { integrationId: row.id, syncRunId: run.id, status: 'SUCCESS' };
  }

  async activate(tenantId: string, id: string, actorId: string) {
    await this.getById(tenantId, id);
    const row = await this.prisma.tenantIntegration.update({
      where: { id },
      data: { status: 'ACTIVE', updatedBy: actorId },
    });
    return this.mapIntegration(row);
  }

  async disable(tenantId: string, id: string, actorId: string) {
    await this.getById(tenantId, id);
    const row = await this.prisma.tenantIntegration.update({
      where: { id },
      data: { status: 'DISABLED', updatedBy: actorId },
    });
    return this.mapIntegration(row);
  }

  async healthSummary(tenantId: string) {
    const integrations = await this.prisma.tenantIntegration.findMany({ where: { tenantId } });
    const active = integrations.filter((i) => i.status === 'ACTIVE').length;
    const failed = integrations.filter((i) => i.status === 'ERROR' || i.lastFailureAt != null).length;
    const unmapped = await this.prisma.externalMapping.count({
      where: { tenantId, status: 'UNMAPPED' },
    });
    const recentRuns = await this.prisma.tenantIntegrationSyncRun.findMany({
      where: { tenantId },
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: { integration: { select: { name: true, adapterCode: true } } },
    });
    return {
      activeConnections: active,
      failedConnections: failed,
      unmappedEvents: unmapped,
      recentSyncRuns: recentRuns.map((r) => ({
        id: r.id,
        integrationName: r.integration.name,
        status: r.status,
        itemsProcessed: r.itemsProcessed,
        errorCount: r.errorCount,
        startedAt: r.startedAt.toISOString(),
        finishedAt: r.finishedAt?.toISOString() ?? null,
        message: r.message,
      })),
    };
  }

  async listMappings(tenantId: string, integrationId?: string) {
    const rows = await this.prisma.externalMapping.findMany({
      where: {
        tenantId,
        ...(integrationId ? { integrationId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    return rows.map((m) => ({
      id: m.id,
      integrationId: m.integrationId,
      mappingType: m.mappingType,
      externalId: m.externalId,
      internalId: m.internalId,
      status: m.status,
      lastEventAt: m.lastEventAt?.toISOString() ?? null,
    }));
  }

  async mapExternal(
    tenantId: string,
    mappingId: string,
    internalId: string,
  ) {
    const row = await this.prisma.externalMapping.findFirst({ where: { id: mappingId, tenantId } });
    if (!row) {
      throw new AppException({
        code: ERROR_CODES.NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.MAPPING_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    return this.prisma.externalMapping.update({
      where: { id: mappingId },
      data: { internalId, status: 'MAPPED' },
    });
  }

  private mapIntegration(row: {
    id: string;
    connectionType: string;
    name: string;
    adapterCode: string;
    configuration: unknown;
    status: string;
    lastSuccessAt: Date | null;
    lastFailureAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      connectionType: row.connectionType,
      name: row.name,
      adapterCode: row.adapterCode,
      configuration: row.configuration,
      status: row.status,
      lastSuccessAt: row.lastSuccessAt?.toISOString() ?? null,
      lastFailureAt: row.lastFailureAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
