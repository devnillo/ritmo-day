type AuthError = { code?: string; status?: number } | null | undefined;

const GENERIC = "Algo não saiu como esperado. Tente de novo em instantes.";

const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  INVALID_PASSWORD: "Senha incorreta.",
  INVALID_EMAIL: "Informe um e-mail válido.",
  PASSWORD_TOO_SHORT: "A senha está curta demais.",
  PASSWORD_TOO_LONG: "A senha está longa demais.",
  PASSWORD_COMPROMISED:
    "Esta senha apareceu em vazamentos de dados conhecidos. Por segurança, escolha outra.",
  INVALID_TOKEN: "Este link expirou ou já foi usado. Peça um novo.",
  TOKEN_EXPIRED: "Este link expirou. Peça um novo.",
  SESSION_EXPIRED: "Sua sessão expirou. Entre novamente.",
  SESSION_NOT_FRESH: "Por segurança, entre novamente antes de continuar.",
  EMAIL_ALREADY_VERIFIED: "Seu e-mail já está confirmado.",
  AGE_NOT_CONFIRMED: "É preciso ter 18 anos ou mais para usar o Ritmo.",
  INVALID_NAME: "Informe um nome com até 80 caracteres.",
};

/** Converte erros do Better Auth em mensagens curtas, sem expor detalhes técnicos. */
export function authErrorMessage(error: AuthError): string {
  if (!error) return GENERIC;
  if (error.status === 429) return "Muitas tentativas seguidas. Aguarde um pouco e tente de novo.";
  return (error.code && messages[error.code]) || GENERIC;
}
