import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppException } from '../../../common/exceptions/app.exception';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';
import { MESSAGE_KEYS } from '../../../common/messages/message-keys.constants';
import { MessageCatalogueService } from '../../../common/messages/message-catalogue.service';

export interface WorkflowStageInput {
  sequenceNo: number;
  stageName: string;
  approvalMode?: string;
  approverSource: string;
  approverConfiguration?: Record<string, unknown>;
  minimumApprovals?: number;
  dueAfterMinutes?: number;
}

@Injectable()
export class WorkflowDefinitionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messages: MessageCatalogueService,
  ) {}

  async list(tenantId: string) {
    const defs = await this.prisma.workflowDefinition.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
          take: 1,
          include: { _count: { select: { stages: true } } },
        },
      },
    });
    return defs.map((d) => {
      const latest = d.versions[0];
      return {
        id: d.id,
        code: d.code,
        name: d.name,
        requestType: d.requestType,
        status: d.status,
        stageCount: latest?._count.stages ?? 0,
        versionNo: latest?.versionNo ?? null,
        currentVersionId: d.currentVersionId,
      };
    });
  }

  async create(
    tenantId: string,
    actorId: string,
    dto: {
      code: string;
      name: string;
      requestType: string;
      stages: WorkflowStageInput[];
    },
  ) {
    const existing = await this.prisma.workflowDefinition.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) {
      throw new AppException({
        code: ERROR_CODES.CONFLICT,
        message: this.messages.resolve(MESSAGE_KEYS.WORKFLOW_CODE_EXISTS),
        statusCode: HttpStatus.CONFLICT,
      });
    }
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const def = await tx.workflowDefinition.create({
        data: {
          tenantId,
          code: dto.code.trim(),
          name: dto.name.trim(),
          requestType: dto.requestType,
          status: 'DRAFT',
          createdBy: actorId,
          updatedBy: actorId,
        },
      });
      const version = await tx.workflowVersion.create({
        data: {
          tenantId,
          definitionId: def.id,
          versionNo: 1,
          effectiveFrom: now,
          createdBy: actorId,
          updatedBy: actorId,
        },
      });
      for (const stage of dto.stages) {
        await tx.workflowStage.create({
          data: {
            tenantId,
            workflowVersionId: version.id,
            sequenceNo: stage.sequenceNo,
            stageName: stage.stageName.trim(),
            approvalMode: stage.approvalMode ?? 'SEQUENTIAL',
            approverSource: stage.approverSource,
            approverConfiguration: (stage.approverConfiguration ?? {}) as Prisma.InputJsonValue,
            minimumApprovals: stage.minimumApprovals ?? 1,
            dueAfterMinutes: stage.dueAfterMinutes ?? null,
          },
        });
      }
      await tx.workflowDefinition.update({
        where: { id: def.id },
        data: { currentVersionId: version.id },
      });
      return { id: def.id, versionId: version.id };
    });
  }

  async publish(tenantId: string, definitionId: string, actorId: string) {
    const def = await this.prisma.workflowDefinition.findFirst({
      where: { id: definitionId, tenantId },
    });
    if (!def) {
      throw new AppException({
        code: ERROR_CODES.NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.WORKFLOW_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    const version = def.currentVersionId
      ? await this.prisma.workflowVersion.findFirst({
          where: { id: def.currentVersionId, tenantId },
        })
      : null;
    if (!version) {
      throw new AppException({
        code: ERROR_CODES.BAD_REQUEST,
        message: this.messages.resolve(MESSAGE_KEYS.WORKFLOW_NO_VERSION),
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
    await this.prisma.$transaction([
      this.prisma.workflowVersion.update({
        where: { id: version.id },
        data: {
          publishedAt: new Date(),
          publishedByUserId: actorId,
          updatedBy: actorId,
        },
      }),
      this.prisma.workflowDefinition.update({
        where: { id: def.id },
        data: { status: 'ACTIVE', updatedBy: actorId },
      }),
    ]);
    return { id: def.id, status: 'ACTIVE' };
  }

  async getDetail(tenantId: string, definitionId: string) {
    const def = await this.prisma.workflowDefinition.findFirst({
      where: { id: definitionId, tenantId },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
          take: 1,
          include: { stages: { orderBy: { sequenceNo: 'asc' } } },
        },
      },
    });
    if (!def) {
      throw new AppException({
        code: ERROR_CODES.NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.WORKFLOW_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    const version = def.versions[0];
    return {
      id: def.id,
      code: def.code,
      name: def.name,
      requestType: def.requestType,
      status: def.status,
      version: version
        ? {
            id: version.id,
            versionNo: version.versionNo,
            stages: version.stages.map((s) => ({
              id: s.id,
              sequenceNo: s.sequenceNo,
              stageName: s.stageName,
              approvalMode: s.approvalMode,
              approverSource: s.approverSource,
              minimumApprovals: s.minimumApprovals,
              dueAfterMinutes: s.dueAfterMinutes,
            })),
          }
        : null,
    };
  }
}
