PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_movie` (
	`id` text PRIMARY KEY NOT NULL,
	`ext_id` text,
	`provider` text,
	`title` text NOT NULL,
	`poster` text,
	`poster_source` text,
	`year` integer,
	`rating` real,
	`language` text,
	`genre` text,
	`reason` text,
	`seen` text,
	`seenRating` integer,
	`seenComment` text,
	`created_by` text NOT NULL,
	`recommended_by` text,
	`private` integer DEFAULT false NOT NULL,
	`scheduled` integer,
	`tags` blob,
	`extra` blob,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recommended_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_movie`("id", "ext_id", "provider", "title", "poster", "poster_source", "year", "rating", "language", "genre", "reason", "seen", "seenRating", "seenComment", "created_by", "recommended_by", "private", "scheduled", "tags", "extra") SELECT "id", "ext_id", "provider", "title", "poster", "poster_source", "year", "rating", "language", "genre", "reason", "seen", "seenRating", "seenComment", COALESCE("user_id", (SELECT "id" FROM "user" WHERE "role" = 'admin' ORDER BY rowid LIMIT 1), (SELECT "id" FROM "user" ORDER BY rowid LIMIT 1)), NULL, COALESCE("private", 0), "scheduled", "tags", "extra" FROM `movie`;--> statement-breakpoint
DROP TABLE `movie`;--> statement-breakpoint
ALTER TABLE `__new_movie` RENAME TO `movie`;--> statement-breakpoint
CREATE INDEX `movie_created_by_idx` ON `movie` (`created_by`,`private`);--> statement-breakpoint
CREATE TABLE `__new_series` (
	`id` text PRIMARY KEY NOT NULL,
	`ext_id` text,
	`provider` text,
	`title` text NOT NULL,
	`poster` text,
	`poster_source` text,
	`year` integer,
	`season` integer,
	`seasonHistory` blob,
	`rating` real,
	`language` text,
	`genre` text,
	`reason` text,
	`seen` text,
	`seenRating` integer,
	`seenComment` text,
	`created_by` text NOT NULL,
	`recommended_by` text,
	`private` integer DEFAULT false NOT NULL,
	`scheduled` integer,
	`tags` blob,
	`extra` blob,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recommended_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_series`("id", "ext_id", "provider", "title", "poster", "poster_source", "year", "season", "seasonHistory", "rating", "language", "genre", "reason", "seen", "seenRating", "seenComment", "created_by", "recommended_by", "private", "scheduled", "tags", "extra") SELECT "id", "ext_id", "provider", "title", "poster", "poster_source", "year", "season", "seasonHistory", "rating", "language", "genre", "reason", "seen", "seenRating", "seenComment", COALESCE("user_id", (SELECT "id" FROM "user" WHERE "role" = 'admin' ORDER BY rowid LIMIT 1), (SELECT "id" FROM "user" ORDER BY rowid LIMIT 1)), NULL, COALESCE("private", 0), "scheduled", "tags", "extra" FROM `series`;--> statement-breakpoint
DROP TABLE `series`;--> statement-breakpoint
ALTER TABLE `__new_series` RENAME TO `series`;--> statement-breakpoint
CREATE INDEX `series_created_by_idx` ON `series` (`created_by`,`private`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;
