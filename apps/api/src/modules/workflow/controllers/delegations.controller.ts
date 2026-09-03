import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../authentication/decorators/current-user.decorator';
import { RequirePermissions } from '../../authentication/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard';
import { PermissionGuard } from '../../authentication/guards/permission.guard';
import type { CurrentUserContext } from '../../authentication/interfaces/current-user-context.interface';
import { TENANT_ADMIN_PERMISSIONS, WORKFLOW_PERMISSIONS } from '../../../common/constants/permissions.constants';
import { AppException } from '../../../common/exceptions/app.exception';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';
import { DelegationService } from '../services/delegation.service';
import { CreateDelegationDto } from '../dto/delegation.dto';

@ApiTags('delegations')
@ApiBearerAuth()
@Controller('delegations')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DelegationsController {
  constructor(private readonly service: DelegationService) {}

  @Get()
  @RequirePermissions([WORKFLOW_PERMISSIONS.INBOX_READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_READ], 'ANY')
  list(@CurrentUser() user: CurrentUserContext) {
    return this.service.list(this.tenant(user));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions([WORKFLOW_PERMISSIONS.INBOX_READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE], 'ANY')
  create(@Body() dto: CreateDelegationDto, @CurrentUser() user: CurrentUserContext) {
    return this.service.create(this.tenant(user), user.userId, dto);
  }

  @Delete(':id')
  @RequirePermissions([WORKFLOW_PERMISSIONS.INBOX_READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE], 'ANY')
  revoke(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserContext) {
    return this.service.revoke(this.tenant(user), id, user.userId);
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
