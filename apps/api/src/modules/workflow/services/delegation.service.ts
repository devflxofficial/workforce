import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppException } from '../../../common/exceptions/app.exception';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';
import { MESSAGE_KEYS } from '../../../common/messages/message-keys.constants';
import { MessageCatalogueService } from '../../../common/messages/message-catalogue.service';

@Injectable()
export class DelegationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messages: MessageCatalogueService,
  ) {}

  async list(tenantId: string) {
    const rows = await this.prisma.approvalDelegation.findMany({
      where: { tenantId },
      orderBy: { startsAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      delegatorUserId: r.delegatorUserId,
      delegateUserId: r.delegateUserId,
      requestTypes: r.requestTypes,
      scope: r.scope,
      startsAt: r.startsAt.toISOString(),
      endsAt: r.endsAt.toISOString(),
      reason: r.reason,
      status: r.status,
    }));
  }

  async create(
    tenantId: string,
    actorId: string,
    dto: {
      delegatorUserId: string;
      delegateUserId: string;
      requestTypes: string[];
      startsAt: string;
      endsAt: string;
      reason: string;
      scope?: Record<string, unknown>;
    },
  ) {
    if (dto.delegatorUserId === dto.delegateUserId) {
      throw new AppException({
        code: ERROR_CODES.BAD_REQUEST,
        message: this.messages.resolve(MESSAGE_KEYS.DELEGATION_SELF),
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
    return this.prisma.approvalDelegation.create({
      data: {
        tenantId,
        delegatorUserId: dto.delegatorUserId,
        delegateUserId: dto.delegateUserId,
        requestTypes: dto.requestTypes,
        scope: (dto.scope ?? {}) as Prisma.InputJsonValue,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        reason: dto.reason.trim(),
        status: 'ACTIVE',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async revoke(tenantId: string, id: string, actorId: string) {
    const row = await this.prisma.approvalDelegation.findFirst({ where: { id, tenantId } });
    if (!row) {
      throw new AppException({
        code: ERROR_CODES.NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.DELEGATION_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    return this.prisma.approvalDelegation.update({
      where: { id },
      data: { status: 'REVOKED', updatedBy: actorId },
    });
  }
}
