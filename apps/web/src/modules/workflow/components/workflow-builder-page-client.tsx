'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageHeader } from '../../../components/common/page-header';
import { ROUTES } from '../../../constants/routes.constants';
import { TenantSettingsGate } from '../../tenant/components/tenant-settings-gate';
import { TENANT_ADMIN_PERMISSIONS } from '../../tenant/constants/tenant-admin.permissions';
import { useCreateWorkflowDefinition, usePublishWorkflowDefinition } from '../hooks/use-workflows';
import type { WorkflowStageInput } from '../types/workflow.types';

const REQUEST_TYPES = ['LEAVE', 'CHANGE_REQUEST', 'ATTENDANCE_CORRECTION'] as const;
const APPROVER_SOURCES = ['MANAGER', 'ROLE', 'USER'] as const;

export function WorkflowBuilderPageClient() {
  const t = useTranslations('tenant.approvals.workflowBuilder');
  const tn = useTranslations('tenant.nav');
  const tc = useTranslations('common');
  const router = useRouter();
  const create = useCreateWorkflowDefinition();
  const publish = usePublishWorkflowDefinition();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [requestType, setRequestType] = useState<string>('LEAVE');
  const [stages, setStages] = useState<WorkflowStageInput[]>([
    { sequenceNo: 1, stageName: 'Manager approval', approverSource: 'MANAGER' },
  ]);

  function addStage() {
    setStages((s) => [
      ...s,
      { sequenceNo: s.length + 1, stageName: '', approverSource: 'MANAGER' },
    ]);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await create.mutateAsync({
      code,
      name,
      requestType,
      stages: stages.map((st, i) => ({ ...st, sequenceNo: i + 1 })),
    });
    const created = res.data;
    if (created && 'id' in created && typeof created.id === 'string') {
      await publish.mutateAsync(created.id);
    }
    router.push(ROUTES.TENANT.APPROVALS.WORKFLOWS);
  }

  return (
    <TenantSettingsGate permission={TENANT_ADMIN_PERMISSIONS.SETTINGS_MANAGE}>
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
          breadcrumbs={[
            { label: tn('home'), href: ROUTES.TENANT.DASHBOARD },
            { label: tn('approvals'), href: ROUTES.TENANT.APPROVALS.ROOT },
            { label: t('title') },
          ]}
        />
        <form onSubmit={onSubmit} className="max-w-2xl space-y-4 rounded-xl border border-border-default bg-surface-primary p-6">
          <input required placeholder={t('fields.code')} value={code} onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm" />
          <input required placeholder={t('fields.name')} value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm" />
          <select value={requestType} onChange={(e) => setRequestType(e.target.value)}
            className="w-full rounded-md border border-border-default px-3 py-2 text-body-sm">
            {REQUEST_TYPES.map((rt) => (
              <option key={rt} value={rt}>{rt}</option>
            ))}
          </select>
          <div className="space-y-3">
            <h2 className="text-title-sm font-semibold">{t('stagesTitle')}</h2>
            {stages.map((stage, idx) => (
              <div key={idx} className="grid gap-2 rounded-md border border-border-default p-3 sm:grid-cols-2">
                <input
                  required
                  placeholder={t('fields.stageName')}
                  value={stage.stageName}
                  onChange={(e) => setStages((s) => s.map((st, i) => i === idx ? { ...st, stageName: e.target.value } : st))}
                  className="rounded-md border border-border-default px-3 py-2 text-body-sm"
                />
                <select
                  value={stage.approverSource}
                  onChange={(e) => setStages((s) => s.map((st, i) => i === idx ? { ...st, approverSource: e.target.value } : st))}
                  className="rounded-md border border-border-default px-3 py-2 text-body-sm"
                >
                  {APPROVER_SOURCES.map((src) => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>
            ))}
            <button type="button" onClick={addStage} className="text-body-sm text-brand-blue-600 hover:underline">
              {t('addStage')}
            </button>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={create.isPending}
              className="rounded-md bg-brand-blue-600 px-4 py-2 text-body-sm font-semibold text-white">
              {t('saveAndPublish')}
            </button>
            <button type="button" onClick={() => router.back()} className="rounded-md border px-4 py-2 text-body-sm">
              {tc('cancel')}
            </button>
          </div>
        </form>
      </div>
    </TenantSettingsGate>
  );
}
