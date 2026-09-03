'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { tenantAdminKeys } from './use-tenant-admin';

/** SSE subscription — invalidates tenant-admin queries on server events. */
export function useTenantRealtime(enabled = true): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const source = new EventSource('/api/v1/realtime/stream');

    const onMessage = () => {
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.all });
    };

    source.addEventListener('message', onMessage);
    source.onmessage = onMessage;

    return () => {
      source.close();
    };
  }, [enabled, qc]);
}
