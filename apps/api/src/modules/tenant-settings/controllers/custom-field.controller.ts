import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../authentication/decorators/current-user.decorator';
import { RequirePermissions } from '../../authentication/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard';
import { PermissionGuard } from '../../authentication/guards/permission.guard';
import type { CurrentUserContext } from '../../authentication/interfaces/current-user-context.interface';
import { TENANT_ADMIN_PERMISSIONS } from '../../../common/constants/permissions.constants';
import { AppException } from '../../../common/exceptions/app.exception';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';
import { CustomFieldService } from '../services/custom-field.service';
import { CreateCustomFieldDto, UpdateCustomFieldDto } from '../dto/custom-field.dto';

@ApiTags('custom-fields')
@ApiBearerAuth()
@Controller('custom-field-definitions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CustomFieldController {
  constructor(private readonly service: CustomFieldService) {}

  @Get()
  @RequirePermissions(TENANT_ADMIN_PERMISSIONS.SETTINGS_READ)
  list(@CurrentUser() user: CurrentUserContext) {
    return this.service.list(this.tenant(user));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE)
  create(@Body() dto: CreateCustomFieldDto, @CurrentUser() user: CurrentUserContext) {
    return this.service.create(this.tenant(user), user.userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomFieldDto,
    @CurrentUser() user: CurrentUserContext,
  ) {
    return this.service.update(this.tenant(user), id, user.userId, dto);
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
