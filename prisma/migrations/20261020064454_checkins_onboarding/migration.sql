-- CreateTable
CREATE TABLE "daily_check_ins" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "local_date" DATE NOT NULL,
    "mood" SMALLINT,
    "energy" SMALLINT,
    "sleep_minutes" SMALLINT,
    "sleep_quality" SMALLINT,
    "note_encrypted" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "daily_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_states" (
    "user_id" UUID NOT NULL,
    "step" SMALLINT NOT NULL DEFAULT 0,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "onboarding_states_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_check_ins_user_id_local_date_key" ON "daily_check_ins"("user_id", "local_date");

-- AddForeignKey
ALTER TABLE "daily_check_ins" ADD CONSTRAINT "daily_check_ins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_states" ADD CONSTRAINT "onboarding_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
