CREATE TABLE `booking_state` (
	`cluster` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL
);
