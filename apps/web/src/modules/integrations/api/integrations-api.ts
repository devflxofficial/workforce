import { apiClient } from '../../../lib/api/client';
import type { ApiSuccessResponse } from '../../../lib/api/types';
import type { IntegrationItem } from '../types/integrations.types';
import type {
  CreateTenantIntegrationPayload,
  ExternalMapping,
  IntegrationHealthSummary,
  TenantIntegrationDetail,
  UpdateTenantIntegrationPayload,
} from '../types/integrations-extended.types';

export const integrationsApi = {
  list: () =>
    apiClient.get<ApiSuccessResponse<IntegrationItem[]>>('/integrations').then((r) => r.data),

  health: () =>
    apiClient
      .get<ApiSuccessResponse<IntegrationHealthSummary>>('/integrations/health')
      .then((r) => r.data),

  mappings: (integrationId?: string) =>
    apiClient
      .get<ApiSuccessResponse<ExternalMapping[]>>('/integrations/mappings', {
        params: integrationId ? { integrationId } : undefined,
      })
      .then((r) => r.data),

  mapExternal: (mappingId: string, internalId: string) =>
    apiClient
      .patch<ApiSuccessResponse<ExternalMapping>>(`/integrations/mappings/${mappingId}`, { internalId })
      .then((r) => r.data),

  tenant: {
    create: (payload: CreateTenantIntegrationPayload) =>
      apiClient
        .post<ApiSuccessResponse<TenantIntegrationDetail>>('/integrations/tenant', payload)
        .then((r) => r.data),
    get: (id: string) =>
      apiClient
        .get<ApiSuccessResponse<TenantIntegrationDetail>>(`/integrations/tenant/${id}`)
        .then((r) => r.data),
    update: (id: string, payload: UpdateTenantIntegrationPayload) =>
      apiClient
        .patch<ApiSuccessResponse<TenantIntegrationDetail>>(`/integrations/tenant/${id}`, payload)
        .then((r) => r.data),
    test: (id: string) =>
      apiClient.post<ApiSuccessResponse<{ integrationId: string; syncRunId: string; status: string }>>(
        `/integrations/tenant/${id}/test`,
      ).then((r) => r.data),
    activate: (id: string) =>
      apiClient
        .post<ApiSuccessResponse<TenantIntegrationDetail>>(`/integrations/tenant/${id}/activate`)
        .then((r) => r.data),
    disable: (id: string) =>
      apiClient
        .post<ApiSuccessResponse<TenantIntegrationDetail>>(`/integrations/tenant/${id}/disable`)
        .then((r) => r.data),
  },
};
