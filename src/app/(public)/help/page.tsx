import type { Metadata } from "next";
import { PhoneIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Ajuda",
  description: "Onde encontrar apoio humano agora.",
};

const contacts = [
  {
    name: "CVV — Centro de Valorização da Vida",
    phone: "188",
    detail: "Apoio emocional gratuito, sigiloso, 24 horas por dia. Também por chat em cvv.org.br.",
    link: { href: "https://cvv.org.br", label: "cvv.org.br" },
  },
  {
    name: "SAMU",
    phone: "192",
    detail: "Emergências de saúde, inclusive quando há risco à vida.",
  },
  {
    name: "Polícia Militar",
    phone: "190",
    detail: "Situações de violência ou perigo imediato.",
  },
];

export default function HelpPage() {
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Você não precisa passar por isso sozinho(a).
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Se as coisas estão pesadas agora, conversar com alguém pode ajudar. Os contatos abaixo são
          gratuitos.
        </p>
      </header>

      <section aria-labelledby="agora" className="space-y-4">
        <h2 id="agora" className="text-lg font-medium">
          Falar com alguém agora
        </h2>
        <ul className="space-y-3">
          {contacts.map(({ name, phone, detail, link }) => (
            <li
              key={phone}
              className="flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center"
            >
              <div className="flex-1 space-y-1">
                <p className="font-medium">{name}</p>
                <p className="text-sm text-muted-foreground">
                  {detail}
                  {link && (
                    <>
                      {" "}
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4"
                      >
                        {link.label}
                      </a>
                    </>
                  )}
                </p>
              </div>
              <a
                href={`tel:${phone}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label={`Ligar para ${name}: ${phone}`}
              >
                <PhoneIcon className="size-4" aria-hidden />
                {phone}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Em perigo imediato, ligue 192 ou vá ao pronto-socorro ou UPA mais próximo. Fora do Brasil, procure o
          número de emergência local.
        </p>
      </section>

      <section aria-labelledby="continuo" className="space-y-3">
        <h2 id="continuo" className="text-lg font-medium">
          Acompanhamento contínuo
        </h2>
        <p className="text-muted-foreground">
          Pelo SUS, você pode procurar a Unidade Básica de Saúde (posto de saúde) mais próxima ou o CAPS —
          Centro de Atenção Psicossocial — da sua cidade. O atendimento é gratuito.
        </p>
      </section>

      <p className="border-t pt-6 text-sm text-muted-foreground">
        O Ritmo é uma ferramenta de organização pessoal. Ele não faz diagnóstico e não substitui
        acompanhamento de profissionais de saúde.
      </p>
    </article>
  );
}
