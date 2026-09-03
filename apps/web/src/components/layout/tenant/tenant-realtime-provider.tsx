'use client';

import { useTenantRealtime } from '../../../modules/tenant/hooks/use-tenant-realtime';

export function TenantRealtimeProvider() {
  useTenantRealtime(true);
  return null;
}
