import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../authentication/decorators/current-user.decorator';
import { RequirePermissions } from '../../authentication/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard';
import { PermissionGuard } from '../../authentication/guards/permission.guard';
import type { CurrentUserContext } from '../../authentication/interfaces/current-user-context.interface';
import { TENANT_INTEGRATION_PERMISSIONS } from '../../../common/constants/permissions.constants';
import { AppException } from '../../../common/exceptions/app.exception';
import { ERROR_CODES } from '../../../common/constants/error-codes.constants';
import { TenantIntegrationService } from '../services/tenant-integration.service';
import { CreateTenantIntegrationDto, UpdateTenantIntegrationDto } from '../dto/tenant-integration.dto';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('integrations')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TenantIntegrationsController {
  constructor(private readonly integrations: TenantIntegrationService) {}

  @Get('health')
  @RequirePermissions(TENANT_INTEGRATION_PERMISSIONS.READ)
  @ApiOperation({ summary: 'Integration health summary (SCR-INT-05)' })
  health(@CurrentUser() user: CurrentUserContext) {
    return this.integrations.healthSummary(this.tenant(user));
  }

  @Get('mappings')
  @RequirePermissions(TENANT_INTEGRATION_PERMISSIONS.READ)
  @ApiOperation({ summary: 'External ID mappings (SCR-INT-04)' })
  mappings(
    @CurrentUser() user: CurrentUserContext,
    @Query('integrationId') integrationId?: string,
  ) {
    return this.integrations.listMappings(this.tenant(user), integrationId);
  }

  @Patch('mappings/:mappingId')
  @RequirePermissions(TENANT_INTEGRATION_PERMISSIONS.MANAGE)
  mapMapping(
    @Param('mappingId', ParseUUIDPipe) mappingId: string,
    @Body('internalId') internalId: string,
    @CurrentUser() user: CurrentUserContext,
  ) {
    return this.integrations.mapExternal(this.tenant(user), mappingId, internalId);
  }

  @Post('tenant')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(TENANT_INTEGRATION_PERMISSIONS.MANAGE)
  @ApiOperation({ summary: 'Create tenant integration (SCR-INT-02)' })
  create(@Body() dto: CreateTenantIntegrationDto, @CurrentUser() user: CurrentUserContext) {
    return this.integrations.create(this.tenant(user), user.userId, dto);
  }

  @Get('tenant/:id')
  @RequirePermissions(TENANT_INTEGRATION_PERMISSIONS.READ)
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserContext) {
    return this.integrations.getById(this.tenant(user), id);
  }

  @Patch('tenant/:id')
  @RequirePermissions(TENANT_INTEGRATION_PERMISSIONS.MANAGE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantIntegrationDto,
    @CurrentUser() user: CurrentUserContext,
  ) {
    return this.integrations.update(this.tenant(user), id, user.userId, dto);
  }

  @Post('tenant/:id/test')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(TENANT_INTEGRATION_PERMISSIONS.MANAGE)
  test(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserContext) {
    return this.integrations.test(this.tenant(user), id, user.userId);
  }

  @Post('tenant/:id/activate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(TENANT_INTEGRATION_PERMISSIONS.MANAGE)
  activate(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserContext) {
    return this.integrations.activate(this.tenant(user), id, user.userId);
  }

  @Post('tenant/:id/disable')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(TENANT_INTEGRATION_PERMISSIONS.MANAGE)
  disable(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserContext) {
    return this.integrations.disable(this.tenant(user), id, user.userId);
  }

  private tenant(user: CurrentUserContext): string {
    if (!user.tenantId) {
      throw new AppException({
        code: ERROR_CODES.BAD_REQUEST,
        message: 'This endpoint requires a tenant-scoped JWT.',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
    return user.tenantId;
  }
}
