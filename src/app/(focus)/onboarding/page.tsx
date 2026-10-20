import type { Metadata } from "next";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import { parseStoredAnswers } from "@/features/onboarding/schemas";
import { requireUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";

export const metadata: Metadata = { title: "Montar meu plano" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const state = await getDb().onboardingState.findUnique({ where: { userId: user.id } });
  const completed = state?.completedAt != null;

  return (
    <>
      {completed && (
        <p className="mb-8 rounded-xl bg-muted px-4 py-3 text-sm">
          Você já montou um plano antes. Refazer só adiciona hábitos novos; os atuais continuam como estão.
        </p>
      )}
      <OnboardingWizard
        initialAnswers={parseStoredAnswers(state?.answers)}
        initialStep={completed ? 0 : (state?.step ?? 0)}
      />
    </>
  );
}
