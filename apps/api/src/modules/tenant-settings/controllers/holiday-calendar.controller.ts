import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../authentication/decorators/current-user.decorator';
import { RequirePermissions } from '../../authentication/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard';
import { PermissionGuard } from '../../authentication/guards/permission.guard';
import type { CurrentUserContext } from '../../authentication/interfaces/current-user-context.interface';
import { LEAVE_PERMISSIONS, TENANT_ADMIN_PERMISSIONS } from '../../../common/constants/permissions.constants';
import { AppException } from '../../../common/exceptions/app.exception';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';
import { HolidayCalendarService } from '../services/holiday-calendar.service';
import { CreateHolidayCalendarDto, CreateHolidayDto } from '../dto/holiday-calendar.dto';

@ApiTags('holiday-calendars')
@ApiBearerAuth()
@Controller('holiday-calendars')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class HolidayCalendarController {
  constructor(private readonly service: HolidayCalendarService) {}

  @Get()
  @RequirePermissions([LEAVE_PERMISSIONS.TYPE_READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_READ], 'ANY')
  @ApiOperation({ summary: 'List holiday calendars (SCR-SET-03)' })
  list(@CurrentUser() user: CurrentUserContext) {
    return this.service.listCalendars(this.tenant(user));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions([LEAVE_PERMISSIONS.TYPE_MANAGE, TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE], 'ANY')
  create(@Body() dto: CreateHolidayCalendarDto, @CurrentUser() user: CurrentUserContext) {
    return this.service.createCalendar(this.tenant(user), user.userId, dto);
  }

  @Get(':calendarId/holidays')
  @RequirePermissions([LEAVE_PERMISSIONS.TYPE_READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_READ], 'ANY')
  listHolidays(@Param('calendarId', ParseUUIDPipe) calendarId: string, @CurrentUser() user: CurrentUserContext) {
    return this.service.listHolidays(this.tenant(user), calendarId);
  }

  @Post(':calendarId/holidays')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions([LEAVE_PERMISSIONS.TYPE_MANAGE, TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE], 'ANY')
  createHoliday(
    @Param('calendarId', ParseUUIDPipe) calendarId: string,
    @Body() dto: CreateHolidayDto,
    @CurrentUser() user: CurrentUserContext,
  ) {
    return this.service.createHoliday(this.tenant(user), calendarId, user.userId, dto);
  }

  @Delete('holidays/:holidayId')
  @RequirePermissions([LEAVE_PERMISSIONS.TYPE_MANAGE, TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE], 'ANY')
  deleteHoliday(@Param('holidayId', ParseUUIDPipe) holidayId: string, @CurrentUser() user: CurrentUserContext) {
    return this.service.deleteHoliday(this.tenant(user), holidayId);
  }

  private tenant(user: CurrentUserContext): string {
    if (!user.tenantId) {
      throw new AppException({
        code: ERROR_CODES.BAD_REQUEST,
        message: 'Tenant context required.',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
    return user.tenantId;
  }
}
