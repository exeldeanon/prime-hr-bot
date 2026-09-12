CREATE TABLE `candidate_applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_update_id` integer NOT NULL,
	`flow_id` text,
	`chat_id` text NOT NULL,
	`telegram_user_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`age` integer NOT NULL,
	`experience` text NOT NULL,
	`citizenship_city` text NOT NULL,
	`equipment` text NOT NULL,
	`online_ready` text NOT NULL,
	`employment_status` text NOT NULL,
	`vacancy_id` text NOT NULL,
	`manager_delivery_status` text DEFAULT 'not_configured' NOT NULL,
	`manager_delivered_at` integer,
	`raw_payload` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `candidate_applications_source_update_id_unique` ON `candidate_applications` (`source_update_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `candidate_applications_flow_id_unique` ON `candidate_applications` (`flow_id`);--> statement-breakpoint
CREATE TABLE `processed_telegram_updates` (
	`update_id` integer PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`processed_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `telegram_sessions` (
	`chat_id` text PRIMARY KEY NOT NULL,
	`telegram_user_id` text NOT NULL,
	`flow_id` text,
	`current_step` text NOT NULL,
	`accepted_at` integer,
	`selected_vacancy_id` text,
	`last_update_id` integer,
	`draft_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
