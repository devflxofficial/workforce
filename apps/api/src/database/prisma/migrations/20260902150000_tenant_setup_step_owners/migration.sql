-- SCR-TEN-01: per-step ownership for tenant setup checklist
ALTER TABLE "tenant_settings" ADD COLUMN IF NOT EXISTS "setup_step_owners" JSONB NOT NULL DEFAULT '{}';
