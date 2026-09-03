# Tenant Admin Console — E2E Traceability

Sources: UX §6.1 / §7.2 / §11 SCR-TEN-01…06, SCR-SET-01–04, SCR-AUD-01–06, SCR-SUB-01–04, SCR-ORG, SCR-EMP, SCR-ATT, SCR-LVE, SCR-PAY, SCR-WFL, SCR-RPT, SCR-INT.

## Shell (§6.1 / §7.2)

| Requirement | Frontend | Status |
|-------------|----------|--------|
| 12-item Tenant Admin nav | `tenant-admin-nav.constants.ts`, `use-tenant-nav.ts` | Completed |
| HR §7.3 nav (non–tenant-admin) | `hr-nav.constants.ts` | Completed |
| Navbar utilities | `tenant-shell.tsx` | Completed |
| Current module badge | `current-module-badge.tsx` | Completed |
| Sidebar 244/224/80px | `app-shell.tsx` | Completed |
| Tenant name in sidebar | `tenant-shell.tsx` | Completed |

## Tenant setup & settings

| Screen | Route | Status |
|--------|-------|--------|
| SCR-TEN-01 | `/dashboard` | Completed (checklist UX) |
| SCR-TEN-02 | `/settings/company` | Completed |
| SCR-TEN-03 | `/settings/branding` | Completed |
| SCR-TEN-04 | `/settings/regional` | Completed |
| SCR-TEN-05 | `/settings/users` | Completed |
| SCR-TEN-06 | `/settings/modules` | Completed |
| SCR-SET-01 | `/settings` | Completed |
| SCR-SET-02 | `/settings/custom-fields` | Completed |
| SCR-SET-03 | `/settings/holiday-calendar` | Completed |
| SCR-SET-04 | `/settings/payroll-calendar` | Completed |

## Subscription & audit

| Screen | Route | Status |
|--------|-------|--------|
| SCR-SUB-01–04 | `/subscription`, compare, upgrade | Completed |
| SCR-AUD-01–06 | `/audit`, settings security/roles/sessions | Completed |

## Integrations

| Screen | Route | Status |
|--------|-------|--------|
| SCR-INT-01 | `/integrations` | Completed |
| SCR-INT-02 | `/integrations/[id]/setup` | Completed |
| SCR-INT-03 | `/integrations/biometric` | Completed |
| SCR-INT-04 | `/integrations/biometric/mapping` | Completed |
| SCR-INT-05 | `/integrations/health` | Completed |
| SCR-INT-06 | `/integrations/credentials` | Completed |

## Approvals / workflows

| Screen | Route | Status |
|--------|-------|--------|
| SCR-WFL-01 | `/approvals` | Completed |
| SCR-WFL-02 | `/approvals/[id]` | Completed |
| SCR-WFL-03 | `/approvals/workflows` | Completed |
| SCR-WFL-04 | `/approvals/workflows/new` | Completed |
| SCR-WFL-05 | `/approvals/delegation` | Completed |
| SCR-WFL-06 | `/approvals/history` | Completed |

## Ops modules (existing routes)

Organisation SCR-ORG-01–08, People SCR-EMP-01–10, Attendance SCR-ATT-07–12, Leave SCR-LVE, Payroll SCR-PAY, Reports SCR-RPT — see `HR_CONSOLE_TRACEABILITY.md` and existing `(tenant)` routes.

## Out of scope

Platform Admin commercial plan management, ESS mobile-only employee screens.
