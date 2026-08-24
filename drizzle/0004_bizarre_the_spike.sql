ALTER TABLE `account` ADD `issuer` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `auth_account_issuer_account_idx` ON `account` (`issuer`,`account_id`);