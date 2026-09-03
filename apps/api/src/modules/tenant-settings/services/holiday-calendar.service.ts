import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppException } from '../../../common/exceptions/app.exception';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';
import { MESSAGE_KEYS } from '../../../common/messages/message-keys.constants';
import { MessageCatalogueService } from '../../../common/messages/message-catalogue.service';

@Injectable()
export class HolidayCalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messages: MessageCatalogueService,
  ) {}

  async listCalendars(tenantId: string) {
    const rows = await this.prisma.holidayCalendar.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { holidays: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      countryCode: r.countryCode,
      legalEntityId: r.legalEntityId,
      branchId: r.branchId,
      status: r.status,
      holidayCount: r._count.holidays,
    }));
  }

  async createCalendar(
    tenantId: string,
    actorId: string,
    dto: {
      code: string;
      name: string;
      countryCode?: string;
      legalEntityId?: string;
      branchId?: string;
    },
  ) {
    const existing = await this.prisma.holidayCalendar.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existing) {
      throw new AppException({
        code: ERROR_CODES.CONFLICT,
        message: this.messages.resolve(MESSAGE_KEYS.HOLIDAY_CALENDAR_CODE_EXISTS),
        statusCode: HttpStatus.CONFLICT,
      });
    }
    return this.prisma.holidayCalendar.create({
      data: {
        tenantId,
        code: dto.code.trim(),
        name: dto.name.trim(),
        countryCode: dto.countryCode ?? null,
        legalEntityId: dto.legalEntityId ?? null,
        branchId: dto.branchId ?? null,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async listHolidays(tenantId: string, calendarId: string) {
    await this.requireCalendar(tenantId, calendarId);
    const rows = await this.prisma.holiday.findMany({
      where: { tenantId, calendarId },
      orderBy: { holidayDate: 'asc' },
    });
    return rows.map((h) => ({
      id: h.id,
      calendarId: h.calendarId,
      holidayDate: h.holidayDate.toISOString().slice(0, 10),
      name: h.name,
      dayFraction: Number(h.dayFraction),
      paid: h.paid,
      recurrenceSource: h.recurrenceSource,
    }));
  }

  async createHoliday(
    tenantId: string,
    calendarId: string,
    actorId: string,
    dto: {
      holidayDate: string;
      name: string;
      dayFraction?: number;
      paid?: boolean;
    },
  ) {
    await this.requireCalendar(tenantId, calendarId);
    const date = new Date(`${dto.holidayDate}T00:00:00.000Z`);
    return this.prisma.holiday.create({
      data: {
        tenantId,
        calendarId,
        holidayDate: date,
        name: dto.name.trim(),
        dayFraction: dto.dayFraction ?? 1,
        paid: dto.paid ?? true,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async deleteHoliday(tenantId: string, holidayId: string) {
    const row = await this.prisma.holiday.findFirst({ where: { id: holidayId, tenantId } });
    if (!row) {
      throw new AppException({
        code: ERROR_CODES.NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.HOLIDAY_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    await this.prisma.holiday.delete({ where: { id: holidayId } });
    return { deleted: true };
  }

  private async requireCalendar(tenantId: string, calendarId: string) {
    const cal = await this.prisma.holidayCalendar.findFirst({
      where: { id: calendarId, tenantId },
    });
    if (!cal) {
      throw new AppException({
        code: ERROR_CODES.NOT_FOUND,
        message: this.messages.resolve(MESSAGE_KEYS.HOLIDAY_CALENDAR_NOT_FOUND),
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    return cal;
  }
}
