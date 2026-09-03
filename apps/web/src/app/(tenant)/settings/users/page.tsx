'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../../components/common/page-header';
import { LoadingSpinner } from '../../../../components/feedback/loading-spinner';
import { EmptyState } from '../../../../components/feedback/empty-state';
import { tenantAdminApi } from '../../../../modules/tenant/api/tenant-admin-api';
import {
  tenantAdminKeys,
  useAssignRole,
  useTenantInvitations,
  useTenantRoles,
  useTenantUser,
  useTenantUsers,
} from '../../../../modules/tenant/hooks/use-tenant-admin';
import { TenantSettingsGate } from '../../../../modules/tenant/components/tenant-settings-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../../../../modules/tenant/constants/tenant-admin.permissions';
import { handleTenantMutationSuccess } from '../../../../modules/tenant/lib/tenant-toast';

export default function UsersSettingsPage() {
  const t = useTranslations();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const users = useTenantUsers({ search: search || undefined, pageSize: 50 });
  const selectedUser = useTenantUser(selectedUserId);
  const invitations = useTenantInvitations();
  const roles = useTenantRoles();
  const assignRole = useAssignRole();
  const [changeRoleId, setChangeRoleId] = useState('');

  const invite = useMutation({
    mutationFn: () =>
      tenantAdminApi.createInvitation({
        email,
        roleIds: roleId ? [roleId] : undefined,
      }),
    onSuccess: (res) => {
      handleTenantMutationSuccess(res);
      setEmail('');
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.invitations() });
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.users() });
      void qc.invalidateQueries({ queryKey: tenantAdminKeys.setup() });
    },
  });

  const invalidateUsers = () => {
    void qc.invalidateQueries({ queryKey: tenantAdminKeys.users() });
    void qc.invalidateQueries({ queryKey: tenantAdminKeys.invitations() });
  };

  if (users.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const rows = users.data?.data ?? [];

  return (
    <TenantSettingsGate permission={TENANT_ADMIN_PERMISSIONS.USER_READ}>
      <div className="space-y-6">
      <PageHeader
        title={t('tenant.settings.users.title')}
        description={t('tenant.settings.users.description')}
      />

      <div className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface-card p-4 sm:flex-row">
        <input
          className="flex-1 rounded-md border border-border-default px-3 py-2"
          placeholder={t('tenant.settings.usersTable.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="flex-1 rounded-md border border-border-default px-3 py-2"
          placeholder={t('tenant.settings.usersTable.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          className="rounded-md border border-border-default px-3 py-2"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        >
          <option value="">{t('tenant.settings.usersTable.roleSelect')}</option>
          {(roles.data?.data ?? []).map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!email || invite.isPending}
          onClick={() => void invite.mutateAsync()}
          className="rounded-md bg-brand-blue-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {t('tenant.settings.users.invite')}
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={t('tenant.settings.users.empty')} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-default">
          <table className="min-w-full text-left text-body-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2">{t('tenant.settings.usersTable.name')}</th>
                <th className="px-3 py-2">{t('tenant.settings.usersTable.email')}</th>
                <th className="px-3 py-2">{t('tenant.settings.usersTable.role')}</th>
                <th className="px-3 py-2">{t('tenant.settings.usersTable.status')}</th>
                <th className="px-3 py-2">{t('tenant.settings.usersTable.lastLogin')}</th>
                <th className="px-3 py-2">{t('tenant.settings.usersTable.mfa')}</th>
                <th className="px-3 py-2">{t('tenant.settings.usersTable.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr
                  key={u.id}
                  className={`cursor-pointer border-t border-border-default ${
                    selectedUserId === u.id ? 'bg-brand-blue-50' : ''
                  }`}
                  onClick={() => setSelectedUserId(u.id)}
                >
                  <td className="px-3 py-2">{u.displayName}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.roles.map((r) => r.name).join(', ')}</td>
                  <td className="px-3 py-2">{u.status}</td>
                  <td className="px-3 py-2">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</td>
                  <td className="px-3 py-2">{u.mfaStatus}</td>
                  <td className="space-x-2 px-3 py-2">
                    <button
                      type="button"
                      className="text-brand-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        void tenantAdminApi.requirePasswordReset(u.id).then(invalidateUsers);
                      }}
                    >
                      {t('tenant.settings.users.requireReset')}
                    </button>
                    <button
                      type="button"
                      className="text-brand-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        void tenantAdminApi.requireMfa(u.id).then(invalidateUsers);
                      }}
                    >
                      {t('tenant.settings.users.requireMfa')}
                    </button>
                    <button
                      type="button"
                      className="text-status-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(t('tenant.settings.users.deactivate'))) {
                          void tenantAdminApi.deactivateUser(u.id).then(invalidateUsers);
                        }
                      }}
                    >
                      {t('tenant.settings.users.deactivate')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUserId ? (
        <aside className="rounded-lg border border-border-default bg-surface-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-title-sm font-semibold">
              {t('tenant.settings.users.detail')}
            </h2>
            <button
              type="button"
              className="text-body-sm text-text-secondary"
              onClick={() => setSelectedUserId(null)}
            >
              {t('common.cancel')}
            </button>
          </div>
          {selectedUser.isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
            <dl className="grid gap-3 text-body-sm sm:grid-cols-2">
              <div>
                <dt className="text-caption text-text-secondary">{t('tenant.settings.usersTable.email')}</dt>
                <dd className="font-medium">{selectedUser.data?.data.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-secondary">{t('tenant.settings.usersTable.status')}</dt>
                <dd className="font-medium">{selectedUser.data?.data.status ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-caption text-text-secondary">{t('tenant.settings.usersTable.role')}</dt>
                <dd className="font-medium">
                  {selectedUser.data?.data.roles.map((r) => r.name).join(', ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-caption text-text-secondary">{t('tenant.settings.usersTable.mfa')}</dt>
                <dd className="font-medium">{selectedUser.data?.data.mfaStatus ?? '—'}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex-1 space-y-1">
                <span className="text-caption text-text-secondary">
                  {t('tenant.settings.usersTable.changeRole')}
                </span>
                <select
                  className="w-full rounded-md border border-border-default px-3 py-2"
                  value={changeRoleId}
                  onChange={(e) => setChangeRoleId(e.target.value)}
                >
                  <option value="">{t('tenant.settings.usersTable.roleSelect')}</option>
                  {(roles.data?.data ?? []).map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!changeRoleId || !selectedUserId || assignRole.isPending}
                className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm text-white disabled:opacity-60"
                onClick={() => {
                  if (!selectedUserId || !changeRoleId) return;
                  void assignRole.mutateAsync({ roleId: changeRoleId, userId: selectedUserId });
                }}
              >
                {t('tenant.settings.usersTable.changeRole')}
              </button>
            </div>
            </>
          )}
        </aside>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-title-sm font-semibold">{t('tenant.settings.users.invitations')}</h2>
        <ul className="space-y-2">
          {(invitations.data?.data ?? []).map((inv) => (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-default px-3 py-2"
            >
              <span>
                {inv.email} · {inv.status}
              </span>
              {inv.status === 'PENDING' || inv.status === 'EXPIRED' ? (
                <span className="space-x-2">
                  <button
                    type="button"
                    className="text-brand-blue-600"
                    onClick={() =>
                      void tenantAdminApi.resendInvitation(inv.id).then(invalidateUsers)
                    }
                  >
                    {t('tenant.settings.users.resend')}
                  </button>
                  <button
                    type="button"
                    className="text-status-danger"
                    onClick={() =>
                      void tenantAdminApi.revokeInvitation(inv.id).then(invalidateUsers)
                    }
                  >
                    {t('tenant.settings.users.revoke')}
                  </button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      </div>
    </TenantSettingsGate>
  );
}
