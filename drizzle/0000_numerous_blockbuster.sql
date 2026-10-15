CREATE TABLE `admin_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`cluster_id` text NOT NULL,
	`actor_id` text NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`kind` text NOT NULL,
	`record_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_tenant_date` ON `admin_audit` (`cluster_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `admin_members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`user_id` text,
	`cluster_id` text NOT NULL,
	`permissions` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `admin_members` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_user_unique` ON `admin_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `managed_records` (
	`id` text PRIMARY KEY NOT NULL,
	`cluster_id` text NOT NULL,
	`kind` text NOT NULL,
	`record_id` text NOT NULL,
	`payload` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `record_tenant_kind_id` ON `managed_records` (`cluster_id`,`kind`,`record_id`);--> statement-breakpoint
CREATE INDEX `records_tenant_kind` ON `managed_records` (`cluster_id`,`kind`);