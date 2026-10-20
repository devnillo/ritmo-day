import {
  CalendarCheckIcon,
  FeatherIcon,
  MessageCircleIcon,
  SproutIcon,
  SunriseIcon,
  WavesIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

type Item = { icon: LucideIcon; title: string; text: string };

const principles: Item[] = [
  {
    icon: SproutIcon,
    title: "Comece pequeno",
    text: "Poucas atividades, cada uma com uma versão mínima para os dias difíceis.",
  },
  {
    icon: WavesIcon,
    title: "No seu ritmo",
    text: "A rotina se adapta à sua energia e ao seu tempo, não o contrário.",
  },
  {
    icon: FeatherIcon,
    title: "Sem cobrança",
    text: "Nada de sequências perdidas ou avisos de falha. Amanhã é um novo dia.",
  },
];

const steps: Item[] = [
  {
    icon: MessageCircleIcon,
    title: "Conte como é seu dia",
    text: "Três perguntas rápidas, sem formulário longo.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Receba um plano leve",
    text: "Você aceita, troca ou remove cada sugestão.",
  },
  { icon: SunriseIcon, title: "Um clique por dia", text: "Marque o que conseguiu. O resto pode esperar." },
];

function IconBadge({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="inline-flex size-10 items-center justify-center rounded-xl border bg-muted">
      <Icon className="size-5" aria-hidden strokeWidth={1.5} />
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="space-y-20 py-8 sm:py-16">
      <section className="space-y-6">
        <IconBadge icon={SunriseIcon} />
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Um dia de cada vez.</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          O Ritmo ajuda você a montar uma rotina leve e possível, mesmo quando falta energia ou é difícil
          começar.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/register" className={buttonVariants({ size: "lg", className: "px-5" })}>
            Começar
          </Link>
          <Link href="/login" className={buttonVariants({ size: "lg", variant: "ghost", className: "px-4" })}>
            Já tenho conta
          </Link>
        </div>
      </section>

      <section aria-labelledby="principios">
        <h2 id="principios" className="sr-only">
          Princípios do Ritmo
        </h2>
        <ul className="grid gap-8 sm:grid-cols-3">
          {principles.map(({ icon, title, text }) => (
            <li key={title} className="space-y-3">
              <IconBadge icon={icon} />
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="como-funciona" className="space-y-6">
        <h2 id="como-funciona" className="text-lg font-medium">
          Como funciona
        </h2>
        <ol className="divide-y rounded-2xl border">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="flex items-start gap-4 p-5">
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden strokeWidth={1.5} />
              <div>
                <p className="font-medium">
                  <span className="sr-only">Passo {index + 1}: </span>
                  {title}
                </p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
