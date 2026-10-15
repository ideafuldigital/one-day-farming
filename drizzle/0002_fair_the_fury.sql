CREATE TABLE `booking_addons` (
	`id` text PRIMARY KEY NOT NULL,
	`cluster` text NOT NULL,
	`payload` text NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media_items` (
	`id` text PRIMARY KEY NOT NULL,
	`scope` text NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`alt` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_customizations` (
	`scope` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stay_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`cluster` text NOT NULL,
	`stay_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_review_per_user_stay` ON `stay_reviews` (`cluster`,`stay_id`,`user_id`);