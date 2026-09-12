CREATE TABLE `operator_accesses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`login` text NOT NULL,
	`token_hash` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`used_at` integer,
	`last_seen_at` integer,
	`expires_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `operator_accesses_login_unique` ON `operator_accesses` (`login`);--> statement-breakpoint
CREATE UNIQUE INDEX `operator_accesses_token_hash_unique` ON `operator_accesses` (`token_hash`);