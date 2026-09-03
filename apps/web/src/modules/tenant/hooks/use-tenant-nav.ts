'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { NavItem } from '../../../components/layout/sidebar-nav';
import { HR_NAV_ITEMS } from '../../hr/constants/hr-nav.constants';
import { TENANT_ADMIN_NAV_ITEMS, type TenantNavItemDef } from '../constants/tenant-admin-nav.constants';
import { TENANT_ADMIN_PERMISSIONS } from '../constants/tenant-admin.permissions';
import { EMPLOYEE_PERMISSIONS } from '../../../lib/permissions/constants';
import { usePermissions } from '../../../lib/permissions/use-permissions';
import { useTenantModules } from '../hooks/use-tenant-admin';

type TranslateFn = ReturnType<typeof useTranslations>;

function isTenantAdministrator(hasPermission: (p: string) => boolean): boolean {
  return (
    hasPermission(TENANT_ADMIN_PERMISSIONS.SETTINGS_READ) ||
    hasPermission(TENANT_ADMIN_PERMISSIONS.PROFILE_READ)
  );
}

function isHrOperator(hasPermission: (p: string) => boolean): boolean {
  return hasPermission(EMPLOYEE_PERMISSIONS.HR_DASHBOARD_READ);
}

function pickNavSource(
  hasPermission: (p: string) => boolean,
): readonly TenantNavItemDef[] {
  if (isTenantAdministrator(hasPermission)) {
    return TENANT_ADMIN_NAV_ITEMS;
  }
  if (isHrOperator(hasPermission)) {
    return HR_NAV_ITEMS;
  }
  return TENANT_ADMIN_NAV_ITEMS;
}

function moduleActive(
  moduleKey: string | undefined,
  modulesByKey: Map<string, string>,
): boolean {
  if (!moduleKey) return true;
  const status = modulesByKey.get(moduleKey);
  if (!status) return true;
  return status === 'active';
}

function toNavItem(
  item: TenantNavItemDef,
  t: TranslateFn,
  modulesByKey: Map<string, string>,
): NavItem | null {
  if (item.moduleKey && !moduleActive(item.moduleKey, modulesByKey)) {
    return null;
  }
  const children = item.children
    ? item.children
        .map((child) => toNavItem(child, t, modulesByKey))
        .filter((c): c is NavItem => c !== null)
    : undefined;

  if (item.children && children && children.length === 0) {
    return null;
  }

  return {
    key: item.key,
    label: t(item.labelKey as Parameters<typeof t>[0]),
    href: item.href,
    status: item.status,
    ...(item.permission ? { permission: item.permission } : {}),
    ...(item.status === 'coming-soon' ? { badge: t('nav.comingSoon') } : {}),
    ...(children && children.length > 0 ? { children } : {}),
  };
}

export function useTenantNavItems(): NavItem[] {
  const t = useTranslations();
  const { hasPermission } = usePermissions();
  const modulesQuery = useTenantModules();

  const modulesByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of modulesQuery.data?.data?.modules ?? []) {
      map.set(m.key, m.status);
    }
    return map;
  }, [modulesQuery.data?.data?.modules]);

  return useMemo(() => {
    const source = pickNavSource(hasPermission);
    return source
      .map((item) => toNavItem(item, t, modulesByKey))
      .filter((item): item is NavItem => item !== null);
  }, [hasPermission, modulesByKey, t]);
}

export function useTenantHomeHref(): string {
  const { hasPermission } = usePermissions();
  if (isTenantAdministrator(hasPermission)) {
    return TENANT_ADMIN_NAV_ITEMS[0]?.href ?? '/dashboard';
  }
  if (isHrOperator(hasPermission)) {
    return HR_NAV_ITEMS.find((i) => i.key === 'hrDashboard')?.href ?? TENANT_ADMIN_NAV_ITEMS[0]?.href ?? '/dashboard';
  }
  return TENANT_ADMIN_NAV_ITEMS[0]?.href ?? '/dashboard';
}
