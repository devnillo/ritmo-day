-- Restrições de domínio que o schema Prisma não consegue expressar.
ALTER TABLE "user_preferences"
  ADD CONSTRAINT "user_preferences_week_starts_on_check" CHECK ("week_starts_on" BETWEEN 0 AND 6),
  ADD CONSTRAINT "user_preferences_preferred_day_start_check" CHECK ("preferred_day_start" BETWEEN 0 AND 1439),
  ADD CONSTRAINT "user_preferences_preferred_day_end_check" CHECK ("preferred_day_end" BETWEEN 0 AND 1439);
