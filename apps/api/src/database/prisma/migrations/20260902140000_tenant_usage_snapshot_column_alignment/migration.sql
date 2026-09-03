-- Align tenant_usage_snapshot column names with schema.prisma @map directives.
-- Previous schema_alignment migration used camelCase DB columns; Prisma expects snake_case for mapped fields.

ALTER TABLE "tenant_usage_snapshot" RENAME COLUMN "apiCallsMonth" TO "api_calls_month";
ALTER TABLE "tenant_usage_snapshot" RENAME COLUMN "storageUsedBytes" TO "storage_used_bytes";

-- Match schema.prisma: updated_at without DB default on these tables
ALTER TABLE "employee_change_request" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "integration_connection" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "leave_request" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "leave_type" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "payslip" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "platform_setting" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "roster_assignment" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "shift" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "shift_assignment" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "tenant_security_policy" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "tenant_settings" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "tenant_upgrade_request" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "user_preference" ALTER COLUMN "updated_at" DROP DEFAULT;
