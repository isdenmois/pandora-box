ALTER TABLE `movie` ADD `poster_source` text;--> statement-breakpoint
ALTER TABLE `series` ADD `poster_source` text;--> statement-breakpoint
UPDATE `movie`
SET `poster_source` = `poster`,
    `poster` = '/images/' || `id` || '.' || CASE
      WHEN `poster` LIKE '%.png%' THEN 'png'
      WHEN `poster` LIKE '%.webp%' THEN 'webp'
      WHEN `poster` LIKE '%.gif%' THEN 'gif'
      ELSE 'jpg'
    END
WHERE `poster` LIKE 'http%';--> statement-breakpoint
UPDATE `series`
SET `poster_source` = `poster`,
    `poster` = '/images/' || `id` || '.' || CASE
      WHEN `poster` LIKE '%.png%' THEN 'png'
      WHEN `poster` LIKE '%.webp%' THEN 'webp'
      WHEN `poster` LIKE '%.gif%' THEN 'gif'
      ELSE 'jpg'
    END
WHERE `poster` LIKE 'http%';
