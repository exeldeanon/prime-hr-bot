CREATE TABLE `manager_login_rate_limits` (
	`client_hash` text PRIMARY KEY NOT NULL,
	`window_started_at` integer NOT NULL,
	`failure_count` integer DEFAULT 0 NOT NULL,
	`blocked_until` integer,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `manager_login_rate_limits_updated_at_idx` ON `manager_login_rate_limits` (`updated_at`);