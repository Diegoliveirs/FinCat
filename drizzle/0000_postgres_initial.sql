CREATE TABLE "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean DEFAULT false NOT NULL,
  "image" text,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  "username" text UNIQUE,
  "display_username" text,
  "role" text DEFAULT 'user' NOT NULL,
  "banned" boolean DEFAULT false NOT NULL,
  "ban_reason" text,
  "ban_expires" timestamp with time zone,
  "force_password_change" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "impersonated_by" text
);
--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE "account" (
  "id" text PRIMARY KEY NOT NULL,
  "issuer" text NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp with time zone,
  "refresh_token_expires_at" timestamp with time zone,
  "scope" text,
  "password" text,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_account_user_id_idx" ON "account" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "auth_account_issuer_account_idx" ON "account" USING btree ("issuer", "account_id");
--> statement-breakpoint
CREATE TABLE "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");
--> statement-breakpoint
CREATE TABLE "rate_limit" (
  "id" text PRIMARY KEY NOT NULL,
  "key" text NOT NULL UNIQUE,
  "count" integer NOT NULL,
  "last_request" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "type" text DEFAULT 'cc' NOT NULL,
  "initial_balance_cents" integer DEFAULT 0 NOT NULL,
  "created_at" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_id_user_idx" ON "accounts" USING btree ("id", "user_id");
--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE "categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "kind" text DEFAULT 'expense' NOT NULL,
  "color" text DEFAULT '#A3BFFF' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "categories_id_user_idx" ON "categories" USING btree ("id", "user_id");
--> statement-breakpoint
CREATE INDEX "categories_user_idx" ON "categories" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE "financial_profile" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE cascade,
  "desired_reserve_cents" integer DEFAULT 0 NOT NULL,
  "minimum_monthly_surplus_cents" integer DEFAULT 0 NOT NULL,
  "unregistered_debt_cents" integer DEFAULT 0 NOT NULL,
  "monthly_income_cents" integer,
  "income_stability" text DEFAULT 'unknown' NOT NULL,
  "max_income_commitment_percent" real DEFAULT 30 NOT NULL,
  "updated_at" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_goals" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "target_amount_cents" integer NOT NULL,
  "target_date" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" integer DEFAULT 0 NOT NULL,
  "updated_at" integer DEFAULT 0 NOT NULL,
  "completed_at" integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX "goals_id_user_idx" ON "financial_goals" USING btree ("id", "user_id");
--> statement-breakpoint
CREATE INDEX "goals_user_status_idx" ON "financial_goals" USING btree ("user_id", "status", "target_date");
--> statement-breakpoint
CREATE TABLE "transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "account_id" integer NOT NULL,
  "category_id" integer NOT NULL,
  "type" text NOT NULL,
  "amount_cents" integer NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "date" text NOT NULL,
  "created_at" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "transactions_account_id_user_id_accounts_id_user_id_fk" FOREIGN KEY ("account_id", "user_id") REFERENCES "accounts"("id", "user_id") ON DELETE cascade,
  CONSTRAINT "transactions_category_id_user_id_categories_id_user_id_fk" FOREIGN KEY ("category_id", "user_id") REFERENCES "categories"("id", "user_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_id_user_idx" ON "transactions" USING btree ("id", "user_id");
--> statement-breakpoint
CREATE INDEX "transactions_user_date_idx" ON "transactions" USING btree ("user_id", "date");
--> statement-breakpoint
CREATE TABLE "budgets" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "category_id" integer NOT NULL,
  "month" text NOT NULL,
  "limit_cents" integer NOT NULL,
  CONSTRAINT "budgets_category_id_user_id_categories_id_user_id_fk" FOREIGN KEY ("category_id", "user_id") REFERENCES "categories"("id", "user_id") ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_id_user_idx" ON "budgets" USING btree ("id", "user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_user_category_month_idx" ON "budgets" USING btree ("user_id", "category_id", "month");
--> statement-breakpoint
CREATE TABLE "savings_entries" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
  "goal_id" integer,
  "amount_cents" integer NOT NULL,
  "saved_at" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "created_at" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "savings_entries_goal_id_user_id_financial_goals_id_user_id_fk" FOREIGN KEY ("goal_id", "user_id") REFERENCES "financial_goals"("id", "user_id") ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX "savings_id_user_idx" ON "savings_entries" USING btree ("id", "user_id");
--> statement-breakpoint
CREATE INDEX "savings_user_date_idx" ON "savings_entries" USING btree ("user_id", "saved_at");
