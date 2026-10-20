-- Restrições de domínio que o schema Prisma não consegue expressar.
ALTER TABLE "habits"
  ADD CONSTRAINT "habits_name_check" CHECK (char_length(btrim("name")) BETWEEN 1 AND 80),
  ADD CONSTRAINT "habits_days_of_week_check" CHECK ("days_of_week" <@ ARRAY[0,1,2,3,4,5,6]::smallint[]),
  ADD CONSTRAINT "habits_times_per_week_check" CHECK ("times_per_week" BETWEEN 1 AND 7),
  ADD CONSTRAINT "habits_preferred_time_check" CHECK ("preferred_time" BETWEEN 0 AND 1439),
  ADD CONSTRAINT "habits_estimated_minutes_check" CHECK ("estimated_minutes" BETWEEN 1 AND 600),
  ADD CONSTRAINT "habits_dates_check" CHECK ("end_date" IS NULL OR "end_date" >= "start_date"),
  ADD CONSTRAINT "habits_frequency_check" CHECK (
    ("frequency_type" <> 'WEEKDAYS' OR cardinality("days_of_week") > 0)
    AND ("frequency_type" <> 'TIMES_PER_WEEK' OR "times_per_week" IS NOT NULL)
  );

ALTER TABLE "routines"
  ADD CONSTRAINT "routines_name_check" CHECK (char_length(btrim("name")) BETWEEN 1 AND 80);

ALTER TABLE "habit_occurrences"
  ADD CONSTRAINT "habit_occurrences_postponed_check" CHECK (
    ("status" = 'POSTPONED') = ("postponed_to" IS NOT NULL)
    AND ("postponed_to" IS NULL OR "postponed_to" > "local_date")
  );
