'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { tenantAdminApi } from '../api/tenant-admin-api';
import {
  handleTenantMutationError,
  handleTenantMutationSuccess,
} from '../lib/tenant-toast';

export const tenantAdminKeys = {
  all: ['tenant-admin'] as const,
  profile: () => [...tenantAdminKeys.all, 'profile'] as const,
  branding: () => [...tenantAdminKeys.all, 'branding'] as const,
  regional: () => [...tenantAdminKeys.all, 'regional'] as const,
  modules: () => [...tenantAdminKeys.all, 'modules'] as const,
  setup: () => [...tenantAdminKeys.all, 'setup'] as const,
  subscription: () => [...tenantAdminKeys.all, 'subscription'] as const,
  planCompare: () => [...tenantAdminKeys.all, 'plan-compare'] as const,
  upgradeRequests: () => [...tenantAdminKeys.all, 'upgrade-requests'] as const,
  usage: () => [...tenantAdminKeys.all, 'usage'] as const,
  security: () => [...tenantAdminKeys.all, 'security'] as const,
  users: (params?: object) => [...tenantAdminKeys.all, 'users', params] as const,
  user: (userId?: string | null) => [...tenantAdminKeys.all, 'user', userId] as const,
  invitations: () => [...tenantAdminKeys.all, 'invitations'] as const,
  roles: () => [...tenantAdminKeys.all, 'roles'] as const,
  permissions: () => [...tenantAdminKeys.all, 'permissions'] as const,
  sessions: () => [...tenantAdminKeys.all, 'sessions'] as const,
  audit: (params?: object) => [...tenantAdminKeys.all, 'audit', params] as const,
  auditSummary: () => [...tenantAdminKeys.all, 'audit-summary'] as const,
  auditDetail: (id?: string) => [...tenantAdminKeys.all, 'audit-detail', id] as const,
};

function useMutationToastHandlers(onSuccessExtra?: () => void) {
  const t = useTranslations();
  return {
    onSuccess: (res: unknown) => {
      handleTenantMutationSuccess(res);
      onSuccessExtra?.();
    },
    onError: (err: unknown) => handleTenantMutationError(err, t('errors.saveFailed')),
  };
}

export function useTenantProfile() {
  return useQuery({ queryKey: tenantAdminKeys.profile(), queryFn: () => tenantAdminApi.getProfile() });
}

export function useUpdateTenantProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantAdminApi.updateProfile,
    ...useMutationToastHandlers(() => {
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.profile() });
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.setup() });
    }),
  });
}

export function useTenantBranding() {
  return useQuery({
    queryKey: tenantAdminKeys.branding(),
    queryFn: () => tenantAdminApi.getBranding(),
    retry: false,
  });
}

export function useUpsertTenantBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantAdminApi.upsertBranding,
    ...useMutationToastHandlers(() => {
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.branding() });
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.setup() });
    }),
  });
}

export function useUploadTenantLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, kind }: { file: File; kind: 'logo' | 'loginLogo' | 'favicon' }) =>
      tenantAdminApi.uploadLogo(file, kind),
    ...useMutationToastHandlers(() => {
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.branding() });
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.setup() });
    }),
  });
}

export function useTenantRegional() {
  return useQuery({ queryKey: tenantAdminKeys.regional(), queryFn: () => tenantAdminApi.getRegional() });
}

export function useUpdateTenantRegional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantAdminApi.updateRegional,
    ...useMutationToastHandlers(() => {
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.regional() });
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.setup() });
    }),
  });
}

export function useTenantModules() {
  return useQuery({ queryKey: tenantAdminKeys.modules(), queryFn: () => tenantAdminApi.getModules() });
}

export function useSetupStatus() {
  return useQuery({
    queryKey: tenantAdminKeys.setup(),
    queryFn: () => tenantAdminApi.getSetupStatus(),
    retry: false,
  });
}

export function useAssignSetupOwners() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignments: Record<string, string>) =>
      tenantAdminApi.assignSetupOwners(assignments),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.setup() });
    },
  });
}

export function useTenantSubscription() {
  return useQuery({
    queryKey: tenantAdminKeys.subscription(),
    queryFn: () => tenantAdminApi.getSubscription(),
  });
}

export function useTenantUsage() {
  return useQuery({ queryKey: tenantAdminKeys.usage(), queryFn: () => tenantAdminApi.getUsage() });
}

export function usePlanComparison() {
  return useQuery({
    queryKey: tenantAdminKeys.planCompare(),
    queryFn: () => tenantAdminApi.comparePlans(),
  });
}

export function useCreateUpgradeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantAdminApi.createUpgradeRequest,
    ...useMutationToastHandlers(() => {
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.subscription() });
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.upgradeRequests() });
    }),
  });
}

export function useUpgradeRequests() {
  return useQuery({
    queryKey: tenantAdminKeys.upgradeRequests(),
    queryFn: () => tenantAdminApi.listUpgradeRequests(),
  });
}

export function useSecurityPolicy() {
  return useQuery({
    queryKey: tenantAdminKeys.security(),
    queryFn: () => tenantAdminApi.getSecurityPolicy(),
  });
}

export function useUpdateSecurityPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantAdminApi.updateSecurityPolicy,
    ...useMutationToastHandlers(() => void qc.invalidateQueries({ queryKey: tenantAdminKeys.security() })),
  });
}

export function useTenantUsers(params?: { page?: number; pageSize?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: tenantAdminKeys.users(params),
    queryFn: () => tenantAdminApi.listUsers(params),
  });
}

export function useTenantUser(userId?: string | null) {
  return useQuery({
    queryKey: tenantAdminKeys.user(userId),
    queryFn: () => tenantAdminApi.getUser(userId!),
    enabled: Boolean(userId),
  });
}

export function useTenantInvitations() {
  return useQuery({
    queryKey: tenantAdminKeys.invitations(),
    queryFn: () => tenantAdminApi.listInvitations(),
  });
}

export function useTenantRoles() {
  return useQuery({ queryKey: tenantAdminKeys.roles(), queryFn: () => tenantAdminApi.listRoles() });
}

export function useDeleteTenantRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tenantAdminApi.deleteRole,
    ...useMutationToastHandlers(() => {
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.roles() });
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.users() });
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.setup() });
    }),
  });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      tenantAdminApi.assignRole(roleId, userId),
    ...useMutationToastHandlers(() => {
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.users() });
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.roles() });
    }),
  });
}

export function useRevokeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, userId }: { roleId: string; userId: string }) =>
      tenantAdminApi.revokeRole(roleId, userId),
    ...useMutationToastHandlers(() => {
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.users() });
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.roles() });
    }),
  });
}

export function usePermissionsCatalogue() {
  return useQuery({
    queryKey: tenantAdminKeys.permissions(),
    queryFn: () => tenantAdminApi.listPermissions(),
  });
}

export function useTenantSessions() {
  return useQuery({
    queryKey: tenantAdminKeys.sessions(),
    queryFn: () => tenantAdminApi.listSessions(),
  });
}

export function useTenantAudit(params?: {
  page?: number;
  pageSize?: number;
  module?: string;
  action?: string;
  actorId?: string;
  severity?: string;
  fromDate?: string;
  toDate?: string;
}) {
  return useQuery({
    queryKey: tenantAdminKeys.audit(params),
    queryFn: () => tenantAdminApi.listAuditEvents(params),
  });
}

export function useAuditSummary() {
  return useQuery({
    queryKey: tenantAdminKeys.auditSummary(),
    queryFn: () => tenantAdminApi.getAuditSummary(),
  });
}

export function useAuditEventDetail(id?: string) {
  return useQuery({
    queryKey: tenantAdminKeys.auditDetail(id),
    queryFn: () => tenantAdminApi.getAuditEvent(id!),
    enabled: Boolean(id),
  });
}
