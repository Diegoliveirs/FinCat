PRAGMA foreign_keys=OFF;--> statement-breakpoint
DROP TABLE IF EXISTS `savings_entries`;--> statement-breakpoint
DROP TABLE IF EXISTS `financial_goals`;--> statement-breakpoint
DROP TABLE IF EXISTS `financial_profile`;--> statement-breakpoint
DROP TABLE IF EXISTS `budgets`;--> statement-breakpoint
DROP TABLE IF EXISTS `transactions`;--> statement-breakpoint
DROP TABLE IF EXISTS `accounts`;--> statement-breakpoint
DROP TABLE IF EXISTS `categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `auth_account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `financial_goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`target_amount_cents` integer NOT NULL,
	`target_date` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `goals_id_user_idx` ON `financial_goals` (`id`,`user_id`);--> statement-breakpoint
CREATE INDEX `goals_user_status_idx` ON `financial_goals` (`user_id`,`status`,`target_date`);--> statement-breakpoint
CREATE TABLE `financial_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`desired_reserve_cents` integer DEFAULT 0 NOT NULL,
	`minimum_monthly_surplus_cents` integer DEFAULT 0 NOT NULL,
	`unregistered_debt_cents` integer DEFAULT 0 NOT NULL,
	`monthly_income_cents` integer,
	`income_stability` text DEFAULT 'unknown' NOT NULL,
	`max_income_commitment_percent` real DEFAULT 30 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `financial_profile_user_id_unique` ON `financial_profile` (`user_id`);--> statement-breakpoint
CREATE TABLE `rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rate_limit_key_unique` ON `rate_limit` (`key`);--> statement-breakpoint
CREATE TABLE `savings_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`goal_id` integer,
	`amount_cents` integer NOT NULL,
	`saved_at` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`goal_id`,`user_id`) REFERENCES `financial_goals`(`id`,`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `savings_id_user_idx` ON `savings_entries` (`id`,`user_id`);--> statement-breakpoint
CREATE INDEX `savings_user_date_idx` ON `savings_entries` (`user_id`,`saved_at`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`impersonated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`username` text,
	`display_username` text,
	`role` text DEFAULT 'user' NOT NULL,
	`banned` integer DEFAULT false NOT NULL,
	`ban_reason` text,
	`ban_expires` integer,
	`force_password_change` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'cc' NOT NULL,
	`initial_balance_cents` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_id_user_idx` ON `accounts` (`id`,`user_id`);--> statement-breakpoint
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'expense' NOT NULL,
	`color` text DEFAULT '#A3BFFF' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_id_user_idx` ON `categories` (`id`,`user_id`);--> statement-breakpoint
CREATE INDEX `categories_user_idx` ON `categories` (`user_id`);--> statement-breakpoint
CREATE TABLE `transactions` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `user_id` text NOT NULL, `account_id` integer NOT NULL, `category_id` integer NOT NULL, `type` text NOT NULL, `amount_cents` integer NOT NULL, `description` text DEFAULT '' NOT NULL, `date` text NOT NULL, `created_at` integer DEFAULT 0 NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade, FOREIGN KEY (`account_id`,`user_id`) REFERENCES `accounts`(`id`,`user_id`) ON DELETE cascade, FOREIGN KEY (`category_id`,`user_id`) REFERENCES `categories`(`id`,`user_id`));--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_id_user_idx` ON `transactions` (`id`,`user_id`);--> statement-breakpoint
CREATE INDEX `transactions_user_date_idx` ON `transactions` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `budgets` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `user_id` text NOT NULL, `category_id` integer NOT NULL, `month` text NOT NULL, `limit_cents` integer NOT NULL, FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade, FOREIGN KEY (`category_id`,`user_id`) REFERENCES `categories`(`id`,`user_id`) ON DELETE cascade);--> statement-breakpoint
CREATE UNIQUE INDEX `budgets_id_user_idx` ON `budgets` (`id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `budgets_user_category_month_idx` ON `budgets` (`user_id`,`category_id`,`month`);
