-- CreateEnum
CREATE TYPE "habit_category" AS ENUM ('SELF_CARE', 'SLEEP', 'FOOD', 'EXERCISE', 'ORGANIZATION', 'STUDY', 'WORK', 'LEISURE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "frequency_type" AS ENUM ('DAILY', 'WEEKDAYS', 'TIMES_PER_WEEK');

-- CreateEnum
CREATE TYPE "day_period" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME');

-- CreateEnum
CREATE TYPE "effort" AS ENUM ('LIGHT', 'MODERATE', 'DEMANDING');

-- CreateEnum
CREATE TYPE "occurrence_status" AS ENUM ('COMPLETED', 'PARTIAL', 'SKIPPED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "occurrence_source" AS ENUM ('TODAY', 'HABIT_PAGE', 'ASSISTANT', 'IMPORT');

-- CreateTable
CREATE TABLE "habits" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "habit_category" NOT NULL DEFAULT 'CUSTOM',
    "frequency_type" "frequency_type" NOT NULL DEFAULT 'DAILY',
    "days_of_week" SMALLINT[] DEFAULT ARRAY[]::SMALLINT[],
    "times_per_week" SMALLINT,
    "period" "day_period" NOT NULL DEFAULT 'ANYTIME',
    "preferred_time" SMALLINT,
    "estimated_minutes" SMALLINT,
    "effort" "effort" NOT NULL DEFAULT 'LIGHT',
    "minimum_version" TEXT,
    "is_essential" BOOLEAN NOT NULL DEFAULT false,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "position" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routines" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "period" "day_period",
    "position" INTEGER NOT NULL DEFAULT 0,
    "paused_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_habits" (
    "routine_id" UUID NOT NULL,
    "habit_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "routine_habits_pkey" PRIMARY KEY ("routine_id","habit_id")
);

-- CreateTable
CREATE TABLE "habit_occurrences" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "habit_id" UUID NOT NULL,
    "local_date" DATE NOT NULL,
    "status" "occurrence_status" NOT NULL,
    "postponed_to" DATE,
    "completed_at" TIMESTAMPTZ,
    "note" TEXT,
    "source" "occurrence_source" NOT NULL DEFAULT 'TODAY',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "habit_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_states" (
    "user_id" UUID NOT NULL,
    "local_date" DATE NOT NULL,
    "light_mode" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "day_states_pkey" PRIMARY KEY ("user_id","local_date")
);

-- CreateIndex
CREATE INDEX "habits_user_id_archived_at_position_idx" ON "habits"("user_id", "archived_at", "position");

-- CreateIndex
CREATE INDEX "routines_user_id_position_idx" ON "routines"("user_id", "position");

-- CreateIndex
CREATE INDEX "routine_habits_habit_id_idx" ON "routine_habits"("habit_id");

-- CreateIndex
CREATE INDEX "habit_occurrences_user_id_local_date_idx" ON "habit_occurrences"("user_id", "local_date");

-- CreateIndex
CREATE INDEX "habit_occurrences_user_id_postponed_to_idx" ON "habit_occurrences"("user_id", "postponed_to");

-- CreateIndex
CREATE UNIQUE INDEX "habit_occurrences_habit_id_local_date_key" ON "habit_occurrences"("habit_id", "local_date");

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_habits" ADD CONSTRAINT "routine_habits_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_habits" ADD CONSTRAINT "routine_habits_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_occurrences" ADD CONSTRAINT "habit_occurrences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_occurrences" ADD CONSTRAINT "habit_occurrences_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_states" ADD CONSTRAINT "day_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
