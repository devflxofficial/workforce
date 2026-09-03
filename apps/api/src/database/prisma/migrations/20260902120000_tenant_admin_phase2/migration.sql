-- Tenant Admin Phase 2: holiday calendars, custom fields, payroll calendar, workflows, tenant integrations

CREATE TABLE "holiday_calendar" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "code" VARCHAR(60) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "country_code" CHAR(2),
  "legal_entity_id" UUID,
  "branch_id" UUID,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_by" UUID,
  "row_version" BIGINT NOT NULL DEFAULT 1,
  CONSTRAINT "holiday_calendar_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "holiday_calendar_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "holiday_calendar_legal_entity_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "legal_entity"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "holiday_calendar_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "holiday_calendar_tenant_code_uq" ON "holiday_calendar"("tenant_id", "code");
CREATE INDEX "holiday_calendar_tenant_id_idx" ON "holiday_calendar"("tenant_id");

CREATE TABLE "holiday" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "calendar_id" UUID NOT NULL,
  "holiday_date" DATE NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "day_fraction" DECIMAL(3,2) NOT NULL DEFAULT 1,
  "paid" BOOLEAN NOT NULL DEFAULT true,
  "recurrence_source" VARCHAR(80),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_by" UUID,
  "row_version" BIGINT NOT NULL DEFAULT 1,
  CONSTRAINT "holiday_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "holiday_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "holiday_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "holiday_calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "holiday_tenant_calendar_date_uq" ON "holiday"("tenant_id", "calendar_id", "holiday_date");
CREATE INDEX "holiday_tenant_calendar_idx" ON "holiday"("tenant_id", "calendar_id");

CREATE TABLE "custom_field_definition" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "field_key" VARCHAR(80) NOT NULL,
  "label" VARCHAR(160) NOT NULL,
  "data_type" VARCHAR(20) NOT NULL,
  "configuration" JSONB NOT NULL DEFAULT '{}',
  "required" BOOLEAN NOT NULL DEFAULT false,
  "classification" VARCHAR(20) NOT NULL DEFAULT 'INTERNAL',
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_by" UUID,
  "row_version" BIGINT NOT NULL DEFAULT 1,
  CONSTRAINT "custom_field_definition_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "custom_field_definition_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "custom_field_def_tenant_entity_key_uq" ON "custom_field_definition"("tenant_id", "entity_type", "field_key");
CREATE INDEX "custom_field_def_tenant_id_idx" ON "custom_field_definition"("tenant_id");

CREATE TABLE "payroll_group" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "code" VARCHAR(60) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_by" UUID,
  "row_version" BIGINT NOT NULL DEFAULT 1,
  CONSTRAINT "payroll_group_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_group_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "payroll_group_tenant_code_uq" ON "payroll_group"("tenant_id", "code");
CREATE INDEX "payroll_group_tenant_id_idx" ON "payroll_group"("tenant_id");

CREATE TABLE "payroll_calendar" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "payroll_group_id" UUID NOT NULL,
  "calendar_year" INTEGER NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "published_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_by" UUID,
  "row_version" BIGINT NOT NULL DEFAULT 1,
  CONSTRAINT "payroll_calendar_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_calendar_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payroll_calendar_payroll_group_id_fkey" FOREIGN KEY ("payroll_group_id") REFERENCES "payroll_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "payroll_calendar_tenant_group_year_uq" ON "payroll_calendar"("tenant_id", "payroll_group_id", "calendar_year");
CREATE INDEX "payroll_calendar_tenant_id_idx" ON "payroll_calendar"("tenant_id");

CREATE TABLE "payroll_period" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "payroll_calendar_id" UUID NOT NULL,
  "payroll_group_id" UUID NOT NULL,
  "period_code" VARCHAR(40) NOT NULL,
  "period_start" DATE NOT NULL,
  "period_end" DATE NOT NULL,
  "payment_date" DATE NOT NULL,
  "attendance_cutoff_at" TIMESTAMPTZ(6) NOT NULL,
  "adjustment_cutoff_at" TIMESTAMPTZ(6) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'NOT_OPEN',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_by" UUID,
  "row_version" BIGINT NOT NULL DEFAULT 1,
  CONSTRAINT "payroll_period_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payroll_period_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "payroll_period_payroll_calendar_id_fkey" FOREIGN KEY ("payroll_calendar_id") REFERENCES "payroll_calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "payroll_period_payroll_group_id_fkey" FOREIGN KEY ("payroll_group_id") REFERENCES "payroll_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "payroll_period_tenant_group_code_uq" ON "payroll_period"("tenant_id", "payroll_group_id", "period_code");
CREATE INDEX "payroll_period_tenant_calendar_idx" ON "payroll_period"("tenant_id", "payroll_calendar_id");

CREATE TABLE "workflow_definition" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "code" VARCHAR(80) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "request_type" VARCHAR(60) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "current_version_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_by" UUID,
  "row_version" BIGINT NOT NULL DEFAULT 1,
  CONSTRAINT "workflow_definition_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_definition_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "workflow_definition_tenant_code_uq" ON "workflow_definition"("tenant_id", "code");
CREATE INDEX "workflow_definition_tenant_type_idx" ON "workflow_definition"("tenant_id", "request_type");

CREATE TABLE "workflow_version" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "definition_id" UUID NOT NULL,
  "version_no" INTEGER NOT NULL,
  "applicability" JSONB NOT NULL DEFAULT '{}',
  "sla_configuration" JSONB NOT NULL DEFAULT '{}',
  "effective_from" TIMESTAMPTZ(6) NOT NULL,
  "effective_to" TIMESTAMPTZ(6),
  "published_by_user_id" UUID,
  "published_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_by" UUID,
  "row_version" BIGINT NOT NULL DEFAULT 1,
  CONSTRAINT "workflow_version_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_version_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "workflow_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "workflow_version_tenant_def_ver_uq" ON "workflow_version"("tenant_id", "definition_id", "version_no");
CREATE INDEX "workflow_version_tenant_def_idx" ON "workflow_version"("tenant_id", "definition_id");

CREATE TABLE "workflow_stage" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "workflow_version_id" UUID NOT NULL,
  "sequence_no" INTEGER NOT NULL,
  "stage_name" VARCHAR(160) NOT NULL,
  "approval_mode" VARCHAR(30) NOT NULL DEFAULT 'SEQUENTIAL',
  "approver_source" VARCHAR(40) NOT NULL,
  "approver_configuration" JSONB NOT NULL DEFAULT '{}',
  "minimum_approvals" INTEGER NOT NULL DEFAULT 1,
  "due_after_minutes" INTEGER,
  "escalation_configuration" JSONB NOT NULL DEFAULT '{}',
  "self_approval_prohibited" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "workflow_stage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_stage_workflow_version_id_fkey" FOREIGN KEY ("workflow_version_id") REFERENCES "workflow_version"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "workflow_stage_tenant_ver_seq_uq" ON "workflow_stage"("tenant_id", "workflow_version_id", "sequence_no");

CREATE TABLE "approval_delegation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "delegator_user_id" UUID NOT NULL,
  "delegate_user_id" UUID NOT NULL,
  "request_types" TEXT[] NOT NULL,
  "scope" JSONB NOT NULL DEFAULT '{}',
  "starts_at" TIMESTAMPTZ(6) NOT NULL,
  "ends_at" TIMESTAMPTZ(6) NOT NULL,
  "reason" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_by" UUID,
  "row_version" BIGINT NOT NULL DEFAULT 1,
  CONSTRAINT "approval_delegation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "approval_delegation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "approval_delegation_delegator_idx" ON "approval_delegation"("tenant_id", "delegator_user_id");
CREATE INDEX "approval_delegation_delegate_idx" ON "approval_delegation"("tenant_id", "delegate_user_id");

CREATE TABLE "workflow_action" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "request_type" VARCHAR(60) NOT NULL,
  "request_id" UUID NOT NULL,
  "action_type" VARCHAR(40) NOT NULL,
  "actor_user_id" UUID,
  "comment" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "correlation_id" UUID,
  CONSTRAINT "workflow_action_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "workflow_action_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "workflow_action_tenant_request_idx" ON "workflow_action"("tenant_id", "request_type", "request_id");
CREATE INDEX "workflow_action_tenant_occurred_idx" ON "workflow_action"("tenant_id", "occurred_at");

CREATE TABLE "tenant_integration" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "connection_type" VARCHAR(40) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "adapter_code" VARCHAR(100) NOT NULL,
  "adapter_version" INTEGER NOT NULL DEFAULT 1,
  "configuration" JSONB NOT NULL DEFAULT '{}',
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "last_success_at" TIMESTAMPTZ(6),
  "last_failure_at" TIMESTAMPTZ(6),
  "checkpoint" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by" UUID,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  "updated_by" UUID,
  "row_version" BIGINT NOT NULL DEFAULT 1,
  CONSTRAINT "tenant_integration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tenant_integration_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "tenant_integration_tenant_type_status_idx" ON "tenant_integration"("tenant_id", "connection_type", "status");

CREATE TABLE "tenant_integration_sync_run" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "integration_id" UUID NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "items_processed" INTEGER NOT NULL DEFAULT 0,
  "error_count" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMPTZ(6),
  "message" TEXT,
  CONSTRAINT "tenant_integration_sync_run_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "tenant_integration_sync_run_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "tenant_integration"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "tenant_integration_sync_run_integration_idx" ON "tenant_integration_sync_run"("integration_id", "started_at");

CREATE TABLE "external_mapping" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "integration_id" UUID NOT NULL,
  "mapping_type" VARCHAR(40) NOT NULL,
  "external_id" VARCHAR(200) NOT NULL,
  "internal_id" UUID,
  "status" VARCHAR(20) NOT NULL DEFAULT 'UNMAPPED',
  "last_event_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "external_mapping_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "external_mapping_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "external_mapping_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "tenant_integration"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "external_mapping_tenant_ext_uq" ON "external_mapping"("tenant_id", "integration_id", "mapping_type", "external_id");
CREATE INDEX "external_mapping_tenant_status_idx" ON "external_mapping"("tenant_id", "status");
