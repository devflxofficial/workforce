/**
 * Development demo role login smoke — real M02 auth via demo access buttons.
 *
 * Prerequisites:
 *   DEMO_LOGIN_PASSWORD='...' npm run db:seed:demo-users   (apps/api)
 *   NEXT_PUBLIC_DEMO_LOGIN_ENABLED=true in apps/web/.env.local
 *
 * Run:
 *   DEMO_LOGIN_E2E=1 PW_CHANNEL=chrome npx playwright test e2e/demo-role-login.spec.ts
 */
import { test, expect } from '@playwright/test';
import {
  API_BASE,
  DEMO_IDENTITIES,
  assertPlatformApiDenied,
  demoApiLogin,
  demoLoginViaButton,
  demoLogout,
  expectDemoPanelVisible,
} from './helpers/demo-auth';

const enabled = process.env.DEMO_LOGIN_E2E === '1';

test.describe.serial('Development demo role login', () => {
  test.skip(!enabled, 'Set DEMO_LOGIN_E2E=1 to run demo role login smoke tests');

  test('demo access panel is visible on login (dev only)', async ({ page }) => {
    await expectDemoPanelVisible(page);
    await expect(page.getByRole('button', { name: DEMO_IDENTITIES.tenantAdmin.label })).toBeVisible();
    await expect(page.getByRole('button', { name: DEMO_IDENTITIES.hrAdmin.label })).toBeVisible();
    await expect(page.getByRole('button', { name: DEMO_IDENTITIES.manager.label })).toBeVisible();
    await expect(page.getByRole('button', { name: DEMO_IDENTITIES.employee.label })).toBeVisible();
  });

  test('tenant admin: demo login → dashboard → platform denied → logout', async ({ page }) => {
    await demoLoginViaButton(page, 'tenantAdmin');
    await expect(page.locator('main')).toBeVisible();
    await page.goto('/platform/dashboard');
    await expect(page).toHaveURL(/\/forbidden/, { timeout: 30_000 });
    await demoLogout(page);
  });

  test('tenant admin: settings hub and audit investigation (FLOW-09)', async ({ page }) => {
    await demoLoginViaButton(page, 'tenantAdmin');
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.goto('/audit');
    await expect(page.getByRole('heading', { name: /audit log/i })).toBeVisible({
      timeout: 30_000,
    });
    await demoLogout(page);
  });

  test('hr admin: demo login → HR dashboard → platform denied → logout', async ({ page }) => {
    await demoLoginViaButton(page, 'hrAdmin');
    await expect(page.getByRole('heading', { name: /hr dashboard/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.goto('/platform/dashboard');
    await expect(page).toHaveURL(/\/forbidden/, { timeout: 30_000 });
    await demoLogout(page);
  });

  test('manager: demo login → tenant dashboard → platform denied → logout', async ({ page }) => {
    await demoLoginViaButton(page, 'manager');
    await expect(page.locator('main')).toBeVisible();
    await page.goto('/platform/dashboard');
    await expect(page).toHaveURL(/\/forbidden/, { timeout: 30_000 });
    await demoLogout(page);
  });

  test('employee: demo login → ESS home → platform denied → logout', async ({ page }) => {
    await demoLoginViaButton(page, 'employee');
    await expect(page).toHaveURL(/\/my/, { timeout: 30_000 });
    await expect(page.locator('main')).toBeVisible();
    await page.goto('/platform/dashboard');
    await expect(page).toHaveURL(/\/forbidden/, { timeout: 30_000 });
    await demoLogout(page);
  });

  test('/auth/me API scopes for all demo identities', async () => {
    const tenantAdmin = await demoApiLogin(DEMO_IDENTITIES.tenantAdmin.email);
    expect(tenantAdmin.me.scope).toBe('tenant');
    expect(tenantAdmin.me.roles).toContain('Tenant Admin');
    expect(tenantAdmin.me.permissions).toContain('read:tenant_settings:tenant');
    expect(tenantAdmin.me.permissions?.some((p) => p.startsWith('platform.'))).toBe(false);
    await assertPlatformApiDenied(tenantAdmin.token);

    const hrAdmin = await demoApiLogin(DEMO_IDENTITIES.hrAdmin.email);
    expect(hrAdmin.me.scope).toBe('tenant');
    expect(hrAdmin.me.roles).toContain('HR Manager');
    expect(hrAdmin.me.permissions).toContain('hr.dashboard.read');
    await assertPlatformApiDenied(hrAdmin.token);

    const manager = await demoApiLogin(DEMO_IDENTITIES.manager.email);
    expect(manager.me.scope).toBe('tenant');
    expect(manager.me.roles).toContain('Department Manager');
    expect(manager.me.permissions).toContain('read:employee:department');
    expect(manager.me.permissions).not.toContain('read:employee:tenant');
    await assertPlatformApiDenied(manager.token);

    const employee = await demoApiLogin(DEMO_IDENTITIES.employee.email);
    expect(employee.me.scope).toBe('tenant');
    expect(employee.me.roles).toContain('Employee');
    expect(employee.me.permissions).toContain('ess.dashboard.read');
    await assertPlatformApiDenied(employee.token);

    const employeeListRes = await fetch(`${API_BASE}/employees?limit=1`, {
      headers: { Authorization: `Bearer ${employee.token}` },
    });
    expect(employeeListRes.status).toBe(403);
  });
});
