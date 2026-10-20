-- Restrições de domínio que o schema Prisma não consegue expressar.
ALTER TABLE "daily_check_ins"
  ADD CONSTRAINT "daily_check_ins_mood_check" CHECK ("mood" BETWEEN 1 AND 5),
  ADD CONSTRAINT "daily_check_ins_energy_check" CHECK ("energy" BETWEEN 1 AND 5),
  ADD CONSTRAINT "daily_check_ins_sleep_minutes_check" CHECK ("sleep_minutes" BETWEEN 0 AND 1440),
  ADD CONSTRAINT "daily_check_ins_sleep_quality_check" CHECK ("sleep_quality" BETWEEN 1 AND 5);
