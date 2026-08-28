ALTER TABLE "rate_limits" ALTER COLUMN "last_request" TYPE bigint;
--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "created_at" TYPE bigint;
--> statement-breakpoint
ALTER TABLE "financial_profile" ALTER COLUMN "updated_at" TYPE bigint;
--> statement-breakpoint
ALTER TABLE "financial_goals" ALTER COLUMN "created_at" TYPE bigint;
--> statement-breakpoint
ALTER TABLE "financial_goals" ALTER COLUMN "updated_at" TYPE bigint;
--> statement-breakpoint
ALTER TABLE "financial_goals" ALTER COLUMN "completed_at" TYPE bigint;
--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "created_at" TYPE bigint;
--> statement-breakpoint
ALTER TABLE "savings_entries" ALTER COLUMN "created_at" TYPE bigint;
