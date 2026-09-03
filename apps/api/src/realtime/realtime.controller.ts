import { Controller, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Observable } from 'rxjs';
import { JwtAuthGuard } from '../modules/authentication/guards/jwt-auth.guard';
import { CurrentUser } from '../modules/authentication/decorators/current-user.decorator';
import type { CurrentUserContext } from '../modules/authentication/interfaces/current-user-context.interface';
import { RealtimeService, type RealtimeEvent } from './realtime.service';

@ApiTags('realtime')
@ApiBearerAuth()
@Controller('realtime')
@UseGuards(JwtAuthGuard)
export class RealtimeController {
  constructor(private readonly realtime: RealtimeService) {}

  @Sse('stream')
  @ApiOperation({ summary: 'Tenant-scoped SSE stream for live UI sync' })
  stream(@CurrentUser() user: CurrentUserContext): Observable<{ data: RealtimeEvent }> {
    const tenantId = user.tenantId ?? '';
    return this.realtime.streamForTenant(tenantId);
  }
}
