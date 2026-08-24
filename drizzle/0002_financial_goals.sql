CREATE TABLE IF NOT EXISTS `financial_goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`target_amount_cents` integer NOT NULL,
	`target_date` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT 0 NOT NULL,
	`completed_at` integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `financial_goals_status_date_idx` ON `financial_goals` (`status`,`target_date`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `savings_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`goal_id` integer,
	`amount_cents` integer NOT NULL,
	`saved_at` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `financial_goals`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `savings_entries_goal_idx` ON `savings_entries` (`goal_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `savings_entries_date_idx` ON `savings_entries` (`saved_at`);
