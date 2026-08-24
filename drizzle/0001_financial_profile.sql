CREATE TABLE IF NOT EXISTS `financial_profile` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`desired_reserve_cents` integer DEFAULT 0 NOT NULL,
	`minimum_monthly_surplus_cents` integer DEFAULT 0 NOT NULL,
	`unregistered_debt_cents` integer DEFAULT 0 NOT NULL,
	`monthly_income_cents` integer,
	`income_stability` text DEFAULT 'unknown' NOT NULL,
	`max_income_commitment_percent` real DEFAULT 30 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "financial_profile_singleton" CHECK (`id` = 1)
);
