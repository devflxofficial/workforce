'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { maybeToastSuccess, toastApiError } from '../../../lib/api/toast-api';
import { workflowApi } from '../api/workflow-api';
import type { CreateDelegationPayload, CreateWorkflowDefinitionPayload } from '../types/workflow.types';

export const WORKFLOW_KEYS = {
  all: ['workflows'] as const,
  definitions: () => [...WORKFLOW_KEYS.all, 'definitions'] as const,
  delegations: () => [...WORKFLOW_KEYS.all, 'delegations'] as const,
  history: () => [...WORKFLOW_KEYS.all, 'history'] as const,
};

export function useWorkflowDefinitions() {
  return useQuery({
    queryKey: WORKFLOW_KEYS.definitions(),
    queryFn: () => workflowApi.definitions.list(),
  });
}

export function useCreateWorkflowDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkflowDefinitionPayload) => workflowApi.definitions.create(payload),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: WORKFLOW_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function usePublishWorkflowDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowApi.definitions.publish(id),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: WORKFLOW_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useDelegations() {
  return useQuery({
    queryKey: WORKFLOW_KEYS.delegations(),
    queryFn: () => workflowApi.delegations.list(),
  });
}

export function useCreateDelegation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDelegationPayload) => workflowApi.delegations.create(payload),
    onSuccess: (res) => {
      maybeToastSuccess(res);
      void qc.invalidateQueries({ queryKey: WORKFLOW_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useRevokeDelegation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowApi.delegations.revoke(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: WORKFLOW_KEYS.all });
    },
    onError: (err) => toastApiError(err, 'Request failed'),
  });
}

export function useApprovalHistory() {
  return useQuery({
    queryKey: WORKFLOW_KEYS.history(),
    queryFn: () => workflowApi.history(),
  });
}
