'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useTenantNavItems } from '../../../modules/tenant/hooks/use-tenant-nav';
import type { NavItem } from '../sidebar-nav';
import { ROUTES } from '../../../constants/routes.constants';

function flattenNav(items: NavItem[]): NavItem[] {
  const out: NavItem[] = [];
  for (const item of items) {
    out.push(item);
    if (item.children) out.push(...flattenNav(item.children));
  }
  return out;
}

function isMatch(pathname: string, href: string): boolean {
  if (href === ROUTES.TENANT.DASHBOARD) {
    return pathname === ROUTES.TENANT.DASHBOARD;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Wireframe §2.3 — current module label for header chrome. */
export function CurrentModuleBadge() {
  const pathname = usePathname();
  const navItems = useTenantNavItems();

  const label = useMemo(() => {
    const flat = flattenNav(navItems);
    const matches = flat
      .filter((item) => item.status !== 'coming-soon' && isMatch(pathname, item.href))
      .sort((a, b) => b.href.length - a.href.length);
    return matches[0]?.label ?? null;
  }, [navItems, pathname]);

  if (!label) return null;

  return (
    <div
      className="hidden max-w-[180px] items-center rounded-md border border-border-default bg-surface-canvas px-2.5 py-1.5 text-body-sm text-text-secondary sm:flex"
      title={label}
    >
      <span className="truncate">{label}</span>
    </div>
  );
}
