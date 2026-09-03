'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LoadingSpinner } from '../../../components/feedback/loading-spinner';
import { Badge, type BadgeVariant } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Dialog } from '../../../components/ui/dialog';
import { Select } from '../../../components/ui/select';
import { useAuth } from '../../../lib/auth/auth-provider';
import type { SetupStatus } from '../api/tenant-admin-api';
import {
  useAssignSetupOwners,
  useSetupStatus,
  useTenantUsers,
} from '../hooks/use-tenant-admin';
import { handleTenantMutationSuccess } from '../lib/tenant-toast';

type SetupStep = SetupStatus['steps'][number];
type TFn = ReturnType<typeof useTranslations>;

function greetingKey(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function statusBadgeVariant(status: string): BadgeVariant {
  if (status === 'complete') return 'success';
  if (status === 'in_progress') return 'warning';
  if (status === 'blocked') return 'danger';
  return 'neutral';
}

function statusLabel(t: TFn, status: string): string {
  return t(`tenant.setup.status.${status}` as Parameters<typeof t>[0]);
}

function stepLabel(t: TFn, key: string): string {
  return t(`tenant.setupSteps.${key}` as Parameters<typeof t>[0]);
}

function actionLabel(t: TFn, actionKey: string | null): string | null {
  if (!actionKey) return null;
  return t(`tenant.settings.setup.actions.${actionKey}` as Parameters<typeof t>[0]);
}

function emptyValue(t: TFn): string {
  return t('common.emptyValue');
}

function ownerDisplay(t: TFn, name?: string | null): string {
  if (!name || name === '—' || name === 'User') return emptyValue(t);
  return name;
}

function blockerLabel(t: TFn, step: SetupStep): string {
  if (!step.blockedReason) return t('tenant.settings.setup.blocker.none');
  const key = step.blockedReason.messageKey;
  if (key) {
    return t(key as Parameters<typeof t>[0]);
  }
  return step.blockedReason.message;
}

function requirementIsComplete(req: string): boolean {
  return req.endsWith('_locked') || req.endsWith('_configured') || req === 'employee_data' || req === 'payroll_group';
}

function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-surface-muted ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-brand-blue-600 transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  hint,
  percent,
}: {
  title: string;
  value: string;
  hint?: string;
  percent?: number | null;
}) {
  return (
    <div className="rounded-lg border border-border-default bg-surface-primary p-4 shadow-0 sm:p-5">
      <p className="text-label-md text-text-secondary">{title}</p>
      <p className="mt-1 text-metric-md font-bold tabular-nums text-text-primary">{value}</p>
      {percent != null ? <ProgressBar percent={percent} className="mt-3" /> : null}
      {hint ? <p className="mt-2 text-caption text-text-secondary">{hint}</p> : null}
    </div>
  );
}

function SetupSummaryCards({ setup }: { setup: SetupStatus }) {
  const t = useTranslations();
  const summary = setup.summary;
  const seat = summary?.seatUsage;
  const seatValue =
    seat?.limit != null
      ? t('tenant.settings.setup.summary.seatValueWithLimit', {
          active: seat.active,
          limit: seat.limit,
        })
      : t('tenant.settings.setup.summary.seatValueCount', { count: seat?.active ?? 0 });
  const policyTarget = summary?.policyTarget ?? 5;
  const policyCount = summary?.policyCount ?? 0;
  const readinessTarget = summary?.readinessTarget ?? setup.total;
  const readinessCount = summary?.readinessCount ?? setup.completed;
  const pendingPolicies = Math.max(0, policyTarget - policyCount);
  const remaining = summary?.remainingCount ?? readinessTarget - readinessCount;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title={t('tenant.settings.setup.summary.progress')}
        value={t('tenant.settings.setup.summary.progressValue', { percent: setup.percentComplete })}
        percent={setup.percentComplete}
        hint={t('tenant.settings.setup.summary.progressHint')}
      />
      <SummaryCard
        title={t('tenant.settings.setup.summary.seats')}
        value={seatValue}
        percent={seat?.percent}
        hint={
          seat?.percent != null
            ? t('tenant.settings.setup.summary.seatPercent', { percent: seat.percent })
            : undefined
        }
      />
      <SummaryCard
        title={t('tenant.settings.setup.summary.policies')}
        value={t('tenant.settings.setup.summary.policiesValue', {
          count: policyCount,
          target: policyTarget,
        })}
        percent={policyTarget > 0 ? Math.round((policyCount / policyTarget) * 100) : 0}
        hint={
          pendingPolicies > 0
            ? t('tenant.settings.setup.summary.pendingPolicies', { count: pendingPolicies })
            : undefined
        }
      />
      <SummaryCard
        title={t('tenant.settings.setup.summary.readiness')}
        value={t('tenant.settings.setup.summary.readinessValue', {
          count: readinessCount,
          target: readinessTarget,
        })}
        percent={readinessTarget > 0 ? Math.round((readinessCount / readinessTarget) * 100) : 0}
        hint={t('tenant.settings.setup.summary.remainingSteps', { count: remaining })}
      />
    </div>
  );
}

function BlockerCell({ step, t }: { step: SetupStep; t: TFn }) {
  const label = blockerLabel(t, step);
  if (step.blockedReason) {
    return <span className="text-body-sm text-semantic-danger-fg">{label}</span>;
  }
  return <span className="text-body-sm text-text-tertiary">{label}</span>;
}

function ParallelRequirements({ step, t }: { step: SetupStep; t: TFn }) {
  if (step.key !== 'parallel_payroll' || !step.requirements?.length) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-caption text-text-secondary">
      {step.requirements.map((req) => (
        <li key={req} className="flex items-center gap-1.5">
          <Badge variant={requirementIsComplete(req) ? 'success' : 'neutral'} size="sm">
            {requirementIsComplete(req)
              ? t('tenant.settings.setup.calendar.stepComplete')
              : t('tenant.settings.setup.calendar.stepPending')}
          </Badge>
          <span>
            {t(`tenant.settings.setup.requirements.${req}` as Parameters<typeof t>[0])}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SetupChecklistTable({ steps, t }: { steps: SetupStep[]; t: TFn }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[720px] text-left text-body-sm">
        <thead>
          <tr className="border-b border-border-default text-caption font-medium text-text-tertiary">
            <th className="w-10 px-3 py-2">{t('tenant.settings.setup.table.number')}</th>
            <th className="px-3 py-2">{t('tenant.settings.setup.table.step')}</th>
            <th className="px-3 py-2">{t('tenant.settings.setup.table.owner')}</th>
            <th className="px-3 py-2">{t('tenant.settings.setup.table.status')}</th>
            <th className="px-3 py-2">{t('tenant.settings.setup.table.blocker')}</th>
            <th className="px-3 py-2 text-end">{t('tenant.settings.setup.table.action')}</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => {
            const label = stepLabel(t, step.key);
            const action = actionLabel(t, step.actionKey);
            const canNavigate = Boolean(step.href && step.status !== 'unavailable');

            return (
              <tr
                key={step.key}
                className="border-b border-border-default last:border-0 hover:bg-surface-muted/30"
              >
                <td className="px-3 py-3 tabular-nums text-text-tertiary">
                  {step.sequence ?? emptyValue(t)}
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium text-text-primary">
                    {label}
                    {step.required ? (
                      <span
                        className="ms-1 text-status-danger"
                        title={t('tenant.settings.setup.required')}
                      >
                        {t('tenant.settings.setup.requiredMarker')}
                      </span>
                    ) : null}
                  </div>
                  <ParallelRequirements step={step} t={t} />
                </td>
                <td className="px-3 py-3 text-text-secondary">
                  {ownerDisplay(t, step.ownerDisplayName)}
                </td>
                <td className="px-3 py-3">
                  <Badge variant={statusBadgeVariant(step.status)} dot size="sm">
                    {statusLabel(t, step.status)}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  <BlockerCell step={step} t={t} />
                </td>
                <td className="px-3 py-3 text-end">
                  {action && canNavigate ? (
                    <Link
                      href={step.href!}
                      className="font-medium text-brand-blue-600 hover:underline"
                    >
                      {action}
                    </Link>
                  ) : (
                    <span className="text-text-tertiary">{emptyValue(t)}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SetupChecklistMobileCards({ steps, t }: { steps: SetupStep[]; t: TFn }) {
  return (
    <ul className="space-y-3 lg:hidden">
      {steps.map((step) => {
        const label = stepLabel(t, step.key);
        const action = actionLabel(t, step.actionKey);
        const canNavigate = Boolean(step.href && step.status !== 'unavailable');

        const card = (
          <div className="rounded-lg border border-border-default bg-surface-primary p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-text-primary">
                  {label}
                  {step.required ? (
                    <span className="ms-1 text-status-danger">
                      {t('tenant.settings.setup.requiredMarker')}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-caption text-text-secondary">
                  {t('tenant.settings.setup.table.owner')}: {ownerDisplay(t, step.ownerDisplayName)}
                </p>
              </div>
              <Badge variant={statusBadgeVariant(step.status)} dot size="sm">
                {statusLabel(t, step.status)}
              </Badge>
            </div>
            <div className="mt-2 text-caption text-text-secondary">
              {t('tenant.settings.setup.table.blocker')}: {blockerLabel(t, step)}
            </div>
            <ParallelRequirements step={step} t={t} />
            {action && canNavigate ? (
              <div className="mt-3">
                <span className="inline-flex rounded-md border border-border-default px-3 py-1.5 text-caption font-medium text-brand-blue-600">
                  {action}
                </span>
              </div>
            ) : null}
          </div>
        );

        if (canNavigate) {
          return (
            <li key={step.key}>
              <Link
                href={step.href!}
                className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600"
              >
                {card}
              </Link>
            </li>
          );
        }
        return <li key={step.key}>{card}</li>;
      })}
    </ul>
  );
}

function ImplementationSupportPanel({
  setup,
  t,
  onAssignOwnership,
  onDownload,
}: {
  setup: SetupStatus;
  t: TFn;
  onAssignOwnership: () => void;
  onDownload: () => void;
}) {
  const nextKey = setup.summary?.nextStepKey;
  const nextHref = setup.summary?.nextStepHref;
  const calendar = setup.implementationCalendar ?? [];

  return (
    <aside className="space-y-4 rounded-lg border border-border-default bg-surface-card p-4 sm:p-5">
      <h3 className="text-title-sm font-semibold text-text-primary">
        {t('tenant.settings.setup.support.title')}
      </h3>

      {nextKey && nextHref ? (
        <div className="rounded-lg border border-border-default bg-surface-muted/30 p-4">
          <p className="text-label-md font-medium text-text-primary">
            {t('tenant.settings.setup.support.nextAction')}
          </p>
          <p className="mt-1 text-body-sm font-medium text-text-primary">
            {stepLabel(t, nextKey)}
          </p>
          <p className="mt-1 text-caption text-text-secondary">
            {t('tenant.settings.setup.support.nextActionHint')}
          </p>
          <Link href={nextHref} className="mt-3 inline-block">
            <Button variant="primary" size="sm">
              {t('tenant.settings.setup.support.goToStep', { step: stepLabel(t, nextKey) })}
            </Button>
          </Link>
        </div>
      ) : null}

      <div>
        <p className="text-label-md font-medium text-text-primary">
          {t('tenant.settings.setup.calendar.title')}
        </p>
        <ul className="mt-3 space-y-4">
          {calendar.map((week) => (
            <li key={week.key}>
              <div className="flex items-center justify-between gap-2 text-body-sm">
                <span className="font-medium text-text-primary">
                  {t(`tenant.settings.setup.calendar.${week.labelKey}` as Parameters<typeof t>[0])}
                </span>
                <span className="tabular-nums text-text-tertiary">{week.percent}%</span>
              </div>
              <ProgressBar percent={week.percent} className="mt-1.5" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {week.stepKeys.map((stepKey) => {
                  const st = week.stepStatuses[stepKey] ?? 'incomplete';
                  const isComplete = st === 'complete';
                  return (
                    <span
                      key={stepKey}
                      className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-caption text-text-secondary"
                    >
                      <Badge variant={isComplete ? 'success' : 'neutral'} size="sm">
                        {isComplete
                          ? t('tenant.settings.setup.calendar.stepComplete')
                          : t('tenant.settings.setup.calendar.stepPending')}
                      </Badge>
                      {stepLabel(t, stepKey)}
                    </span>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-label-md font-medium text-text-primary">
          {t('tenant.settings.setup.support.resources')}
        </p>
        <ul className="mt-2 space-y-2">
          <li>
            <a
              href="https://docs.workforcecloud.os"
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-sm text-brand-blue-600 hover:underline"
            >
              {t('tenant.settings.setup.documentation')}
            </a>
          </li>
          <li>
            <a
              href="mailto:support@workforcecloud.os"
              className="text-body-sm text-brand-blue-600 hover:underline"
            >
              {t('tenant.settings.setup.contactSupport')}
            </a>
          </li>
          <li>
            <button
              type="button"
              onClick={onDownload}
              className="text-body-sm text-brand-blue-600 hover:underline"
            >
              {t('tenant.settings.setup.downloadChecklist')}
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={onAssignOwnership}
              className="text-body-sm text-brand-blue-600 hover:underline"
            >
              {t('tenant.settings.setup.assignOwnership')}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}

function AssignOwnershipDialog({
  open,
  onOpenChange,
  steps,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: SetupStep[];
  t: TFn;
}) {
  const users = useTenantUsers({ pageSize: 100 });
  const assign = useAssignSetupOwners();
  const [draft, setDraft] = useState<Record<string, string>>({});

  const userOptions = useMemo(
    () =>
      (users.data?.data ?? []).map((u) => ({
        value: u.id,
        label: u.displayName || u.email,
      })),
    [users.data?.data],
  );

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string> = {};
    for (const step of steps) {
      if (step.ownerUserId) initial[step.key] = step.ownerUserId;
    }
    setDraft(initial);
  }, [open, steps]);

  const handleSave = async () => {
    const assignments: Record<string, string> = {};
    for (const [key, userId] of Object.entries(draft)) {
      if (userId) assignments[key] = userId;
    }
    const res = await assign.mutateAsync(assignments);
    handleTenantMutationSuccess(res);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('tenant.settings.setup.assignOwnershipTitle')}
      description={t('tenant.settings.setup.assignOwnershipDescription')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={assign.isPending}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={() => void handleSave()} isLoading={assign.isPending}>
            {t('tenant.settings.setup.saveOwners')}
          </Button>
        </>
      }
    >
      {users.isLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      ) : (
        <ul className="space-y-3">
          {steps.map((step) => (
            <li key={step.key} className="grid gap-2 sm:grid-cols-2 sm:items-center">
              <span className="text-body-sm font-medium text-text-primary">
                {stepLabel(t, step.key)}
              </span>
              <Select
                selectSize="sm"
                value={draft[step.key] ?? ''}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [step.key]: e.target.value }))
                }
                options={userOptions}
                placeholder={t('tenant.settings.setup.selectOwner')}
              />
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

function downloadChecklistCsv(setup: SetupStatus, t: TFn) {
  const headers = [
    t('tenant.settings.setup.table.number'),
    t('tenant.settings.setup.table.step'),
    t('tenant.settings.setup.table.owner'),
    t('tenant.settings.setup.table.status'),
    t('tenant.settings.setup.table.blocker'),
    t('tenant.settings.setup.table.action'),
  ];
  const rows = setup.steps.map((step) => [
    step.sequence != null ? String(step.sequence) : emptyValue(t),
    stepLabel(t, step.key),
    ownerDisplay(t, step.ownerDisplayName),
    statusLabel(t, step.status),
    blockerLabel(t, step),
    actionLabel(t, step.actionKey) ?? emptyValue(t),
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = t('tenant.settings.setup.downloadFilename');
  a.click();
  URL.revokeObjectURL(url);
}

export function TenantAdminHomeScreen() {
  const t = useTranslations();
  const { user } = useAuth();
  const { data, isLoading, isError, refetch, isFetching } = useSetupStatus();
  const [assignOpen, setAssignOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <p className="rounded-lg border border-border-default bg-surface-card p-6 text-body-sm text-text-secondary">
        {t('common.error')}
      </p>
    );
  }

  const setup = data.data;
  const welcomeName = user?.displayName ?? t('tenant.admin.label');
  const nextHref = setup.summary?.nextStepHref;
  const greeting = t(`tenant.settings.setup.greeting.${greetingKey()}`, { name: welcomeName });

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {setup.trialExpired ? (
        <div className="rounded-lg border border-semantic-warning bg-semantic-warning-bg px-4 py-3 text-body-sm text-semantic-warning-fg">
          {t('tenant.settings.setup.trialExpired')}
        </div>
      ) : null}
      {setup.supportIntervention ? (
        <div className="rounded-lg border border-semantic-danger bg-semantic-danger-bg px-4 py-3 text-body-sm text-semantic-danger-fg">
          {t('tenant.settings.setup.supportIntervention')}
        </div>
      ) : null}
      {setup.goLiveReady ? (
        <div className="rounded-lg border border-semantic-success bg-semantic-success-bg px-4 py-3 text-body-sm text-semantic-success-fg">
          {t('tenant.settings.setup.goLiveBanner')}
        </div>
      ) : null}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-body-md text-text-secondary">{greeting}</p>
          <h1 className="mt-1 text-heading-h2 font-semibold text-text-primary">
            {t('tenant.settings.setup.title')}
          </h1>
          <p className="mt-1 text-body-sm text-text-secondary">
            {t('tenant.settings.setup.description')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {nextHref ? (
            <Link href={nextHref}>
              <Button variant="primary" size="sm">
                {t('tenant.settings.setup.resume')}
              </Button>
            </Link>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            isLoading={isFetching}
          >
            {t('tenant.settings.setup.refresh')}
          </Button>
        </div>
      </header>

      <SetupSummaryCards setup={setup} />

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <section className="rounded-lg border border-border-default bg-surface-card p-4 sm:p-6">
          <h2 className="text-heading-h3 font-semibold text-text-primary">
            {t('tenant.settings.setup.checklistHeading')}
          </h2>
          <p className="mt-1 text-body-sm text-text-secondary">
            {setup.goLiveReady
              ? t('tenant.settings.setup.goLiveReady')
              : t('tenant.settings.setup.notReady')}
            {' · '}
            <span className="font-semibold text-brand-blue-700">
              {t('tenant.settings.setup.progress', { percent: setup.percentComplete })}
            </span>
          </p>
          <div className="mt-4">
            <SetupChecklistTable steps={setup.steps} t={t} />
            <SetupChecklistMobileCards steps={setup.steps} t={t} />
          </div>
        </section>

        <ImplementationSupportPanel
          setup={setup}
          t={t}
          onAssignOwnership={() => setAssignOpen(true)}
          onDownload={() => downloadChecklistCsv(setup, t)}
        />
      </div>

      <AssignOwnershipDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        steps={setup.steps}
        t={t}
      />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-default bg-surface-primary p-3 shadow-elevation-2 lg:hidden">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => downloadChecklistCsv(setup, t)}>
            {t('tenant.settings.setup.downloadChecklist')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setAssignOpen(true)}>
            {t('tenant.settings.setup.assignOwnership')}
          </Button>
          {nextHref ? (
            <Link href={nextHref}>
              <Button variant="primary" size="sm">
                {t('tenant.settings.setup.resume')}
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
