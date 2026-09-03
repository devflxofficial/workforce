import {
  Body,
  Controller,
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
import { WorkflowDefinitionService } from '../services/workflow-definition.service';
import { CreateWorkflowDefinitionDto } from '../dto/workflow-definition.dto';

@ApiTags('workflow-definitions')
@ApiBearerAuth()
@Controller('workflow-definitions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class WorkflowDefinitionsController {
  constructor(private readonly service: WorkflowDefinitionService) {}

  @Get()
  @RequirePermissions([WORKFLOW_PERMISSIONS.INBOX_READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_READ], 'ANY')
  list(@CurrentUser() user: CurrentUserContext) {
    return this.service.list(this.tenant(user));
  }

  @Get(':id')
  @RequirePermissions([WORKFLOW_PERMISSIONS.INBOX_READ, TENANT_ADMIN_PERMISSIONS.SETTINGS_READ], 'ANY')
  detail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserContext) {
    return this.service.getDetail(this.tenant(user), id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE)
  create(@Body() dto: CreateWorkflowDefinitionDto, @CurrentUser() user: CurrentUserContext) {
    return this.service.create(this.tenant(user), user.userId, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE)
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserContext) {
    return this.service.publish(this.tenant(user), id, user.userId);
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
