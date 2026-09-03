import { apiClient } from '../../../lib/api/client';
import type { ApiSuccessResponse } from '../../../lib/api/types';
import type {
  ApiClientItem,
  CreateApiClientPayload,
  CreateApiClientResult,
  RotateSecretResult,
} from '../types/integrations-extended.types';

export const apiClientsApi = {
  list: () =>
    apiClient.get<ApiSuccessResponse<ApiClientItem[]>>('/api-clients').then((r) => r.data),

  create: (payload: CreateApiClientPayload) =>
    apiClient.post<ApiSuccessResponse<CreateApiClientResult>>('/api-clients', payload).then((r) => r.data),

  rotateSecret: (clientId: string) =>
    apiClient
      .patch<ApiSuccessResponse<RotateSecretResult>>(`/api-clients/${clientId}/rotate-secret`)
      .then((r) => r.data),

  disable: (clientId: string) =>
    apiClient.patch<ApiSuccessResponse<ApiClientItem>>(`/api-clients/${clientId}/disable`).then((r) => r.data),

  delete: (clientId: string) => apiClient.delete(`/api-clients/${clientId}`),
};
