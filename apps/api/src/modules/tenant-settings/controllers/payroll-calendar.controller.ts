import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../authentication/decorators/current-user.decorator';
import { RequirePermissions } from '../../authentication/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard';
import { PermissionGuard } from '../../authentication/guards/permission.guard';
import type { CurrentUserContext } from '../../authentication/interfaces/current-user-context.interface';
import { PAYROLL_PERMISSIONS, TENANT_ADMIN_PERMISSIONS } from '../../../common/constants/permissions.constants';
import { AppException } from '../../../common/exceptions/app.exception';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';
import { PayrollCalendarService } from '../services/payroll-calendar.service';
import {
  CreatePayrollCalendarDto,
  CreatePayrollGroupDto,
  CreatePayrollPeriodDto,
} from '../dto/payroll-calendar.dto';

@ApiTags('payroll-calendars')
@ApiBearerAuth()
@Controller('payroll')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PayrollCalendarController {
  constructor(private readonly service: PayrollCalendarService) {}

  @Get('groups')
  @RequirePermissions([PAYROLL_PERMISSIONS.READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_READ], 'ANY')
  listGroups(@CurrentUser() user: CurrentUserContext) {
    return this.service.listGroups(this.tenant(user));
  }

  @Post('groups')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions([PAYROLL_PERMISSIONS.READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE], 'ANY')
  createGroup(@Body() dto: CreatePayrollGroupDto, @CurrentUser() user: CurrentUserContext) {
    return this.service.createGroup(this.tenant(user), user.userId, dto);
  }

  @Get('calendars')
  @RequirePermissions([PAYROLL_PERMISSIONS.READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_READ], 'ANY')
  listCalendars(
    @CurrentUser() user: CurrentUserContext,
    @Query('year') yearRaw?: string,
  ) {
    const year = yearRaw ? Number(yearRaw) : undefined;
    return this.service.listCalendars(this.tenant(user), year);
  }

  @Post('calendars')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions([PAYROLL_PERMISSIONS.READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE], 'ANY')
  createCalendar(@Body() dto: CreatePayrollCalendarDto, @CurrentUser() user: CurrentUserContext) {
    return this.service.createCalendar(this.tenant(user), user.userId, dto);
  }

  @Post('calendars/:calendarId/publish')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions([PAYROLL_PERMISSIONS.READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE], 'ANY')
  publish(
    @Param('calendarId', ParseUUIDPipe) calendarId: string,
    @CurrentUser() user: CurrentUserContext,
  ) {
    return this.service.publishCalendar(this.tenant(user), calendarId, user.userId);
  }

  @Get('calendars/:calendarId/periods')
  @RequirePermissions([PAYROLL_PERMISSIONS.READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_READ], 'ANY')
  listPeriods(@Param('calendarId', ParseUUIDPipe) calendarId: string, @CurrentUser() user: CurrentUserContext) {
    return this.service.listPeriods(this.tenant(user), calendarId);
  }

  @Post('calendars/:calendarId/periods')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions([PAYROLL_PERMISSIONS.READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE], 'ANY')
  createPeriod(
    @Param('calendarId', ParseUUIDPipe) calendarId: string,
    @Body() dto: CreatePayrollPeriodDto,
    @CurrentUser() user: CurrentUserContext,
  ) {
    return this.service.createPeriod(this.tenant(user), calendarId, user.userId, dto);
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
