'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { maybeToastSuccess, toastApiError } from '../../../lib/api/toast-api';
import { apiClientsApi } from '../api/api-clients-api';
import { integrationsApi } from '../api/integrations-api';
import type {
  CreateApiClientPayload,
  CreateTenantIntegrationPayload,
  UpdateTenantIntegrationPayload,
} from '../types/integrations-extended.types';

export const INTEGRATIONS_KEYS = {
  all: ['integrations'] as const,
  list: () => [...INTEGRATIONS_KEYS.all, 'list'] as const,
  health: () => [...INTEGRATIONS_KEYS.all, 'health'] as const,
  mappings: (integrationId?: string) => [...INTEGRATIONS_KEYS.all, 'mappings', integrationId] as const,
  tenant: (id: string) => [...INTEGRATIONS_KEYS.all, 'tenant', id] as const,
  apiClients: () => [...INTEGRATIONS_KEYS.all, 'api-clients'] as const,
};

export function useIntegrations() {
  return useQuery({
    queryKey: INTEGRATIONS_KEYS.list(),
    queryFn: () => integrationsApi.list(),
    retry: false,
  });
}

export function useIntegrationHealth() {
  return useQuery({
    queryKey: INTEGRATIONS_KEYS.health(),
    queryFn: () => integrationsApi.health(),
  });
}

export function useExternalMappings(integrationId?: string) {
  return useQuery({
    queryKey: INTEGRATIONS_KEYS.mappings(integrationId),
    queryFn: () => integrationsApi.mappings(integrationId),
  });
}

export function useMapExternal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mappingId, internalId }: { mappingId: string; internalId: string }) =>
      integrationsApi.mapExternal(mappingId, internalId),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: INTEGRATIONS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useTenantIntegration(id: string | undefined) {
  return useQuery({
    queryKey: INTEGRATIONS_KEYS.tenant(id ?? ''),
    queryFn: () => integrationsApi.tenant.get(id!),
    enabled: !!id,
  });
}

export function useCreateTenantIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTenantIntegrationPayload) => integrationsApi.tenant.create(payload),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: INTEGRATIONS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useUpdateTenantIntegration(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTenantIntegrationPayload) => integrationsApi.tenant.update(id, payload),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: INTEGRATIONS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useTestTenantIntegration(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => integrationsApi.tenant.test(id),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: INTEGRATIONS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useActivateTenantIntegration(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => integrationsApi.tenant.activate(id),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: INTEGRATIONS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useDisableTenantIntegration(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => integrationsApi.tenant.disable(id),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: INTEGRATIONS_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useApiClients() {
  return useQuery({
    queryKey: INTEGRATIONS_KEYS.apiClients(),
    queryFn: () => apiClientsApi.list(),
  });
}

export function useCreateApiClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateApiClientPayload) => apiClientsApi.create(payload),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: INTEGRATIONS_KEYS.apiClients() });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useRotateApiClientSecret() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => apiClientsApi.rotateSecret(clientId),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: INTEGRATIONS_KEYS.apiClients() });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useDisableApiClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => apiClientsApi.disable(clientId),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: INTEGRATIONS_KEYS.apiClients() });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useDeleteApiClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) => apiClientsApi.delete(clientId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: INTEGRATIONS_KEYS.apiClients() });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}
