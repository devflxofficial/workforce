import { ROUTES } from '../../../constants/routes.constants';
import { ATTENDANCE_PERMISSIONS } from '../../../lib/permissions/constants';
import { INTEGRATION_PERMISSIONS } from '../../../lib/permissions/constants';
import { EMPLOYEE_PERMISSIONS } from '../../../lib/permissions/constants';
import { LEAVE_PERMISSIONS } from '../../../lib/permissions/constants';
import { ORGANISATION_PERMISSIONS } from '../../../lib/permissions/constants';
import { PAYROLL_PERMISSIONS } from '../../../lib/permissions/constants';
import { REPORT_PERMISSIONS } from '../../../lib/permissions/constants';
import { WORKFLOW_PERMISSIONS } from '../../../lib/permissions/constants';
import { TENANT_ADMIN_PERMISSIONS } from './tenant-admin.permissions';

/** UX Specification §7.2 — canonical Tenant Administrator navigation (12 items). */
export interface TenantNavItemDef {
  key: string;
  labelKey: string;
  href: string;
  status: 'available' | 'coming-soon';
  permission?: string;
  /** Module entitlement key from tenant module catalogue. */
  moduleKey?: string;
  children?: readonly TenantNavItemDef[];
}

export const TENANT_ADMIN_NAV_ITEMS: readonly TenantNavItemDef[] = [
  {
    key: 'home',
    labelKey: 'tenant.nav.home',
    href: ROUTES.TENANT.DASHBOARD,
    status: 'available',
  },
  {
    key: 'organisation',
    labelKey: 'tenant.nav.organisation',
    href: ROUTES.TENANT.ORGANISATION.ROOT,
    status: 'available',
    permission: ORGANISATION_PERMISSIONS.ORG_OVERVIEW_READ,
    moduleKey: 'organisation',
  },
  {
    key: 'people',
    labelKey: 'tenant.nav.people',
    href: ROUTES.TENANT.EMPLOYEES.ROOT,
    status: 'available',
    permission: EMPLOYEE_PERMISSIONS.EMPLOYEE_READ,
    moduleKey: 'employees',
  },
  {
    key: 'attendance',
    labelKey: 'tenant.nav.attendance',
    href: ROUTES.TENANT.ATTENDANCE.ROOT,
    status: 'available',
    permission: ATTENDANCE_PERMISSIONS.RECORD_READ,
    moduleKey: 'attendance',
  },
  {
    key: 'leave',
    labelKey: 'tenant.nav.leave',
    href: ROUTES.TENANT.LEAVE.ROOT,
    status: 'available',
    permission: LEAVE_PERMISSIONS.REQUEST_READ,
    moduleKey: 'leave',
  },
  {
    key: 'payroll',
    labelKey: 'tenant.nav.payroll',
    href: ROUTES.TENANT.PAYROLL.ROOT,
    status: 'available',
    permission: PAYROLL_PERMISSIONS.READ,
    moduleKey: 'payroll',
  },
  {
    key: 'approvals',
    labelKey: 'tenant.nav.approvals',
    href: ROUTES.TENANT.APPROVALS.ROOT,
    status: 'available',
    permission: WORKFLOW_PERMISSIONS.INBOX_READ,
    moduleKey: 'approvals',
  },
  {
    key: 'reports',
    labelKey: 'tenant.nav.reports',
    href: ROUTES.TENANT.REPORTS.ROOT,
    status: 'available',
    permission: REPORT_PERMISSIONS.READ,
    moduleKey: 'reports',
  },
  {
    key: 'integrations',
    labelKey: 'tenant.nav.integrations',
    href: ROUTES.TENANT.INTEGRATIONS.ROOT,
    status: 'available',
    permission: INTEGRATION_PERMISSIONS.MANAGE,
    moduleKey: 'integrations',
  },
  {
    key: 'settings',
    labelKey: 'tenant.nav.settings',
    href: ROUTES.TENANT.SETTINGS,
    status: 'available',
    permission: TENANT_ADMIN_PERMISSIONS.SETTINGS_READ,
  },
  {
    key: 'subscription',
    labelKey: 'tenant.nav.subscription',
    href: ROUTES.TENANT.SUBSCRIPTION,
    status: 'available',
    permission: TENANT_ADMIN_PERMISSIONS.SUBSCRIPTION_READ,
  },
  {
    key: 'audit',
    labelKey: 'tenant.nav.audit',
    href: ROUTES.TENANT.AUDIT,
    status: 'available',
    permission: TENANT_ADMIN_PERMISSIONS.AUDIT_READ,
  },
] as const;
