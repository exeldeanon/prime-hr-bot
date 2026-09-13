ALTER TABLE `candidate_applications` ADD `lead_status` text NOT NULL DEFAULT 'filled';
ALTER TABLE `candidate_applications` ADD `status_changed_at` integer NOT NULL DEFAULT (unixepoch() * 1000);
ALTER TABLE `candidate_applications` ADD `manager_note` text NOT NULL DEFAULT '';
ALTER TABLE `candidate_applications` ADD `telegram_username` text;
ALTER TABLE `candidate_applications` ADD `training_course` text;
ALTER TABLE `candidate_applications` ADD `training_started_at` integer;
