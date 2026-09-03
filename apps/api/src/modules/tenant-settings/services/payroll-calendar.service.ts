import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppException } from '../../../common/exceptions/app.exception';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';
import { MESSAGE_KEYS } from '../../../common/messages/message-keys.constants';
import { MessageCatalogueService } from '../../../common/messages/message-catalogue.service';

@Injectable()
export class PayrollCalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messages: MessageCatalogueService,
  ) {}

  async listGroups(tenantId: string) {
    return this.prisma.payrollGroup.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createGroup(
    tenantId: string,
    actorId: string,
    dto: { code: string; name: string },
  ) {
    return this.prisma.payrollGroup.create({
      data: {
        tenantId,
        code: dto.code.trim(),
        name: dto.name.trim(),
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async listCalendars(tenantId: string, year?: number) {
    const rows = await this.prisma.payrollCalendar.findMany({
      where: {
        tenantId,
        ...(year ? { calendarYear: year } : {}),
      },
      include: {
        payrollGroup: { select: { id: true, code: true, name: true } },
        _count: { select: { periods: true } },
      },
      orderBy: [{ calendarYear: 'desc' }, { payrollGroup: { name: 'asc' } }],
    });
    return rows.map((r) => ({
      id: r.id,
      payrollGroupId: r.payrollGroupId,
      payrollGroupName: r.payrollGroup.name,
      payrollGroupCode: r.payrollGroup.code,
      calendarYear: r.calendarYear,
      status: r.status,
      publishedAt: r.publishedAt,
      periodCount: r._count.periods,
    }));
  }

  async createCalendar(
    tenantId: string,
    actorId: string,
    dto: { payrollGroupId: string; calendarYear: number },
  ) {
    const group = await this.prisma.payrollGroup.findFirst({
      where: { id: dto.payrollGroupId, tenantId },
    });
    if (!group) {
      throw new AppException({
        code: ERROR_CODES.NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.PAYROLL_GROUP_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    return this.prisma.payrollCalendar.create({
      data: {
        tenantId,
        payrollGroupId: dto.payrollGroupId,
        calendarYear: dto.calendarYear,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async listPeriods(tenantId: string, calendarId: string) {
    await this.requireCalendar(tenantId, calendarId);
    const rows = await this.prisma.payrollPeriod.findMany({
      where: { tenantId, payrollCalendarId: calendarId },
      orderBy: { periodStart: 'asc' },
    });
    return rows.map((p) => ({
      id: p.id,
      periodCode: p.periodCode,
      periodStart: p.periodStart.toISOString().slice(0, 10),
      periodEnd: p.periodEnd.toISOString().slice(0, 10),
      paymentDate: p.paymentDate.toISOString().slice(0, 10),
      attendanceCutoffAt: p.attendanceCutoffAt.toISOString(),
      adjustmentCutoffAt: p.adjustmentCutoffAt.toISOString(),
      status: p.status,
    }));
  }

  async createPeriod(
    tenantId: string,
    calendarId: string,
    actorId: string,
    dto: {
      periodCode: string;
      periodStart: string;
      periodEnd: string;
      paymentDate: string;
      attendanceCutoffAt: string;
      adjustmentCutoffAt: string;
    },
  ) {
    const cal = await this.requireCalendar(tenantId, calendarId);
    return this.prisma.payrollPeriod.create({
      data: {
        tenantId,
        payrollCalendarId: calendarId,
        payrollGroupId: cal.payrollGroupId,
        periodCode: dto.periodCode.trim(),
        periodStart: new Date(`${dto.periodStart}T00:00:00.000Z`),
        periodEnd: new Date(`${dto.periodEnd}T00:00:00.000Z`),
        paymentDate: new Date(`${dto.paymentDate}T00:00:00.000Z`),
        attendanceCutoffAt: new Date(dto.attendanceCutoffAt),
        adjustmentCutoffAt: new Date(dto.adjustmentCutoffAt),
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async publishCalendar(tenantId: string, calendarId: string, actorId: string) {
    const cal = await this.requireCalendar(tenantId, calendarId);
    return this.prisma.payrollCalendar.update({
      where: { id: cal.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        updatedBy: actorId,
      },
    });
  }

  private async requireCalendar(tenantId: string, calendarId: string) {
    const cal = await this.prisma.payrollCalendar.findFirst({
      where: { id: calendarId, tenantId },
    });
    if (!cal) {
      throw new AppException({
        code: ERROR_CODES.NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.PAYROLL_CALENDAR_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    return cal;
  }
}
