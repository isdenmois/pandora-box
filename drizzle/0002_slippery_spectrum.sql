CREATE TABLE `movie` (
	`id` text PRIMARY KEY NOT NULL,
	`ext_id` text,
	`provider` text,
	`title` text NOT NULL,
	`poster` text,
	`year` integer,
	`rating` real,
	`language` text,
	`genre` text,
	`reason` text,
	`user_id` text,
	`private` integer,
	`extra` blob
);
--> statement-breakpoint
CREATE TABLE `series` (
	`id` text PRIMARY KEY NOT NULL,
	`ext_id` text,
	`provider` text,
	`title` text NOT NULL,
	`poster` text,
	`year` integer,
	`season` integer,
	`rating` real,
	`language` text,
	`genre` text,
	`reason` text,
	`user_id` text,
	`private` integer,
	`extra` blob
);
