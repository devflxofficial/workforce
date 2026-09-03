-- Tenant Admin completion: upgrade request fields + usage snapshot metrics

ALTER TABLE "tenant_upgrade_request"
  ADD COLUMN IF NOT EXISTS "additional_seats" INTEGER,
  ADD COLUMN IF NOT EXISTS "additional_module_keys" JSONB,
  ADD COLUMN IF NOT EXISTS "requested_effective_date" DATE,
  ADD COLUMN IF NOT EXISTS "contact_person_name" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "business_reason" TEXT;

ALTER TABLE "tenant_usage_snapshot"
  ADD COLUMN IF NOT EXISTS "integration_event_volume" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "export_volume" INTEGER NOT NULL DEFAULT 0;
