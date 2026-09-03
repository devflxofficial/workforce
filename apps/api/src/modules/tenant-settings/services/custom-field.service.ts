import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppException } from '../../../common/exceptions/app.exception';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';
import { MESSAGE_KEYS } from '../../../common/messages/message-keys.constants';
import { MessageCatalogueService } from '../../../common/messages/message-catalogue.service';

const MAX_CUSTOM_FIELDS = 50;

@Injectable()
export class CustomFieldService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messages: MessageCatalogueService,
  ) {}

  async list(tenantId: string) {
    const rows = await this.prisma.customFieldDefinition.findMany({
      where: { tenantId },
      orderBy: [{ entityType: 'asc' }, { label: 'asc' }],
    });
    return rows.map((r) => ({
      id: r.id,
      entityType: r.entityType,
      fieldKey: r.fieldKey,
      label: r.label,
      dataType: r.dataType,
      configuration: r.configuration,
      required: r.required,
      classification: r.classification,
      status: r.status,
    }));
  }

  async create(
    tenantId: string,
    actorId: string,
    dto: {
      entityType: string;
      fieldKey: string;
      label: string;
      dataType: string;
      configuration?: Record<string, unknown>;
      required?: boolean;
      classification?: string;
    },
  ) {
    const count = await this.prisma.customFieldDefinition.count({ where: { tenantId } });
    if (count >= MAX_CUSTOM_FIELDS) {
      throw new AppException({
        code: ERROR_CODES.BAD_REQUEST,
        message: this.messages.resolve(MESSAGE_KEYS.CUSTOM_FIELD_LIMIT),
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
    const existing = await this.prisma.customFieldDefinition.findFirst({
      where: { tenantId, entityType: dto.entityType, fieldKey: dto.fieldKey },
    });
    if (existing) {
      throw new AppException({
        code: ERROR_CODES.CONFLICT,
        message: this.messages.resolve(MESSAGE_KEYS.CUSTOM_FIELD_KEY_EXISTS),
        statusCode: HttpStatus.CONFLICT,
      });
    }
    return this.prisma.customFieldDefinition.create({
      data: {
        tenantId,
        entityType: dto.entityType,
        fieldKey: dto.fieldKey.trim(),
        label: dto.label.trim(),
        dataType: dto.dataType,
        configuration: (dto.configuration ?? {}) as Prisma.InputJsonValue,
        required: dto.required ?? false,
        classification: dto.classification ?? 'INTERNAL',
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    actorId: string,
    dto: {
      label?: string;
      configuration?: Record<string, unknown>;
      required?: boolean;
      status?: string;
    },
  ) {
    const row = await this.prisma.customFieldDefinition.findFirst({ where: { id, tenantId } });
    if (!row) {
      throw new AppException({
        code: ERROR_CODES.NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.CUSTOM_FIELD_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    return this.prisma.customFieldDefinition.update({
      where: { id },
      data: {
        ...(dto.label ? { label: dto.label.trim() } : {}),
        ...(dto.configuration ? { configuration: dto.configuration as Prisma.InputJsonValue } : {}),
        ...(dto.required !== undefined ? { required: dto.required } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        updatedBy: actorId,
      },
    });
  }
}
