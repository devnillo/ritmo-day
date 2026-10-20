import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { legal } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Política de Privacidade" updatedAt={legal.updatedAt}>
      <p>
        O Ritmo ajuda você a organizar rotinas. Para isso, guardamos alguns dados seus. Aqui explicamos quais,
        por quê e o que você pode fazer com eles, de acordo com a Lei Geral de Proteção de Dados (LGPD).
      </p>

      <h2>Quem cuida dos seus dados</h2>
      <p>
        O responsável pelo tratamento é {legal.controller}. Pedidos sobre seus dados: {legal.contactEmail}.
      </p>

      <h2>O que guardamos e para quê</h2>
      <ul>
        <li>
          <strong>Conta</strong> (nome, e-mail, senha protegida por hash, fuso horário): para você entrar e
          para mostrar o dia certo. Base legal: execução do serviço que você pediu.
        </li>
        <li>
          <strong>Hábitos, rotinas e registros</strong>: para montar sua tela Hoje e sua evolução. Base legal:
          execução do serviço.
        </li>
        <li>
          <strong>Check-ins</strong> (humor, energia, sono e nota): são opcionais e podem revelar informações
          sobre sua saúde, por isso são tratados como dados sensíveis. Só são guardados se você preencher, e
          servem apenas para você acompanhar como está. Base legal: seu consentimento, dado ao registrar. A
          nota fica criptografada.
        </li>
        <li>
          <strong>Dados técnicos de sessão</strong> (endereço IP e navegador): para segurança da conta, como
          encerrar sessões e limitar tentativas de login.
        </li>
      </ul>

      <h2>O que não fazemos</h2>
      <ul>
        <li>Não vendemos seus dados.</li>
        <li>
          Não usamos seus check-ins para publicidade nem os enviamos a ferramentas de análise ou
          monitoramento.
        </li>
        <li>Não fazemos diagnósticos nem tiramos conclusões sobre sua saúde.</li>
      </ul>

      <h2>Com quem compartilhamos</h2>
      <p>
        Apenas com fornecedores necessários para o serviço funcionar, como hospedagem e envio de e-mails, que
        só tratam os dados para esse fim. Ao criar ou trocar a senha, verificamos se ela aparece em vazamentos
        conhecidos usando o serviço Have I Been Pwned: só os 5 primeiros caracteres de um resumo (hash) da
        senha são enviados, nunca a senha.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode acessar, corrigir e baixar seus dados e excluir sua conta a qualquer momento em{" "}
        <Link href="/settings/privacy" className="underline underline-offset-4">
          Configurações → Privacidade
        </Link>
        . Também pode retirar o consentimento dos check-ins apagando-os. Para outros pedidos, escreva para{" "}
        {legal.contactEmail}.
      </p>

      <h2>Por quanto tempo guardamos</h2>
      <p>
        Enquanto sua conta existir. Ao excluir a conta, os dados são apagados do banco na hora. Cópias de
        segurança são sobrescritas no ciclo normal de backups.
      </p>

      <h2>Idade</h2>
      <p>O Ritmo é destinado a pessoas com 18 anos ou mais.</p>
    </LegalPage>
  );
}
