import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { legal } from "@/lib/legal";

export const metadata: Metadata = { title: "Termos de Uso" };

export default function TermsPage() {
  return (
    <LegalPage title="Termos de Uso" updatedAt={legal.updatedAt}>
      <p>Ao criar uma conta no Ritmo, você concorda com estes termos. Eles são curtos de propósito.</p>

      <h2>O que o Ritmo é</h2>
      <p>
        Uma ferramenta de organização pessoal para criar e acompanhar rotinas. O Ritmo{" "}
        <strong>não é tratamento médico, terapia nem ferramenta de diagnóstico</strong> e não substitui o
        acompanhamento de profissionais de saúde.
      </p>

      <h2>Se você precisar de ajuda</h2>
      <p>
        Em sofrimento intenso ou em perigo, procure apoio humano. Veja os contatos na página{" "}
        <Link href="/help" className="underline underline-offset-4">
          Precisa de ajuda agora?
        </Link>{" "}
        (CVV 188, SAMU 192).
      </p>

      <h2>Sua conta</h2>
      <ul>
        <li>É preciso ter 18 anos ou mais.</li>
        <li>Mantenha sua senha em segredo. Você é responsável pelo que acontece na sua conta.</li>
        <li>Você pode excluir sua conta quando quiser, em Configurações → Privacidade.</li>
      </ul>

      <h2>Seus dados</h2>
      <p>
        Os dados são seus. O tratamento está descrito na{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Política de Privacidade
        </Link>
        .
      </p>

      <h2>Uso adequado</h2>
      <p>
        Não use o Ritmo para atividades ilegais nem tente acessar dados de outras pessoas ou prejudicar o
        serviço.
      </p>

      <h2>Disponibilidade</h2>
      <p>
        Fazemos o possível para manter o serviço no ar e seus dados seguros, mas ele pode passar por mudanças
        ou interrupções. Avisaremos sobre mudanças importantes nestes termos.
      </p>

      <h2>Contato</h2>
      <p>
        {legal.controller} · {legal.contactEmail}
      </p>
    </LegalPage>
  );
}
