import { ROUTES } from '../../../constants/routes.constants';

/** Tenant Admin nav: see `tenant-admin-nav.constants.ts` (UX §7.2). HR nav: `hr-nav.constants.ts` (§7.3). */

export const ORG_NAV_ITEMS = [
  { key: 'legal-entities', labelKey: 'organisation.nav.legalEntities', href: ROUTES.TENANT.ORGANISATION.LEGAL_ENTITIES },
  { key: 'branches',       labelKey: 'organisation.nav.branches',       href: ROUTES.TENANT.ORGANISATION.BRANCHES },
  { key: 'departments',    labelKey: 'organisation.nav.departments',    href: ROUTES.TENANT.ORGANISATION.DEPARTMENTS },
  { key: 'cost-centres',   labelKey: 'organisation.nav.costCentres',   href: ROUTES.TENANT.ORGANISATION.COST_CENTRES },
  { key: 'positions',      labelKey: 'organisation.nav.positions',      href: ROUTES.TENANT.ORGANISATION.POSITIONS },
  { key: 'grades',         labelKey: 'organisation.grades.title',       href: ROUTES.TENANT.ORGANISATION.GRADES },
] as const;

export const SUPPORTED_COUNTRIES = [
  { code: 'PK', name: 'Pakistan' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
] as const;

export const SUPPORTED_CURRENCIES = [
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'USD', name: 'US Dollar' },
] as const;

export const SUPPORTED_TIMEZONES = [
  { value: 'Asia/Karachi',    label: 'Asia/Karachi (PKT, UTC+5)' },
  { value: 'Asia/Dubai',      label: 'Asia/Dubai (GST, UTC+4)' },
  { value: 'Asia/Riyadh',     label: 'Asia/Riyadh (AST, UTC+3)' },
  { value: 'Europe/London',   label: 'Europe/London (GMT/BST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
] as const;
