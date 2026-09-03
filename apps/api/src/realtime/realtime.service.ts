import { Injectable } from '@nestjs/common';
import { Subject, type Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface RealtimeEvent {
  tenantId: string;
  type: string;
  resource?: string;
  correlationId?: string;
}

@Injectable()
export class RealtimeService {
  private readonly events$ = new Subject<RealtimeEvent>();

  emit(event: RealtimeEvent): void {
    this.events$.next(event);
  }

  streamForTenant(tenantId: string): Observable<{ data: RealtimeEvent }> {
    return this.events$.pipe(
      filter((e) => e.tenantId === tenantId),
      map((data) => ({ data })),
    );
  }
}
