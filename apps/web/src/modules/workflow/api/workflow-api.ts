import { apiClient } from '../../../lib/api/client';
import type { ApiSuccessResponse } from '../../../lib/api/types';
import type {
  ApprovalDelegation,
  ApprovalHistoryItem,
  CreateDelegationPayload,
  CreateWorkflowDefinitionPayload,
  WorkflowDefinitionListItem,
} from '../types/workflow.types';

export const workflowApi = {
  definitions: {
    list: () =>
      apiClient
        .get<ApiSuccessResponse<WorkflowDefinitionListItem[]>>('/workflow-definitions')
        .then((r) => r.data),
    create: (payload: CreateWorkflowDefinitionPayload) =>
      apiClient
        .post<ApiSuccessResponse<WorkflowDefinitionListItem>>('/workflow-definitions', payload)
        .then((r) => r.data),
    publish: (id: string) =>
      apiClient
        .post<ApiSuccessResponse<WorkflowDefinitionListItem>>(`/workflow-definitions/${id}/publish`)
        .then((r) => r.data),
  },
  delegations: {
    list: () =>
      apiClient.get<ApiSuccessResponse<ApprovalDelegation[]>>('/delegations').then((r) => r.data),
    create: (payload: CreateDelegationPayload) =>
      apiClient.post<ApiSuccessResponse<ApprovalDelegation>>('/delegations', payload).then((r) => r.data),
    revoke: (id: string) => apiClient.delete(`/delegations/${id}`),
  },
  history: () =>
    apiClient.get<ApiSuccessResponse<ApprovalHistoryItem[]>>('/approvals/history').then((r) => r.data),
};
