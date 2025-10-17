CREATE TABLE `movie_view` (
	`id` text PRIMARY KEY NOT NULL,
	`movie_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`rating` integer NOT NULL,
	FOREIGN KEY (`movie_id`) REFERENCES `movie`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `series_view` (
	`id` text PRIMARY KEY NOT NULL,
	`series_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`rating` integer NOT NULL,
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `movie` ADD `seen` text;--> statement-breakpoint
ALTER TABLE `series` ADD `seen` text;