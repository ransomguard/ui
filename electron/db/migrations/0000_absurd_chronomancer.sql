CREATE TABLE `system_errors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`timestamp` integer NOT NULL,
	`data` text NOT NULL,
	`reason` text,
	`is_viewed_at` integer,
	`resolved_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_source_timestamp` ON `system_errors` (`source`,`timestamp`);--> statement-breakpoint
CREATE TABLE `security_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sequence_number` integer,
	`type` text NOT NULL,
	`timestamp` integer NOT NULL,
	`data` text NOT NULL,
	`is_viewed_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_type_timestamp` ON `security_logs` (`type`,`timestamp`);--> statement-breakpoint
CREATE TABLE `access_control_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`target` text NOT NULL,
	`action` text NOT NULL,
	`success` integer NOT NULL,
	`ips` text,
	`reason` text,
	`error_message` text,
	`performed_at` integer DEFAULT (unixepoch('subsecond') * 1000) NOT NULL
);
