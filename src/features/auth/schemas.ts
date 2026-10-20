import { z } from "zod";

// Senhas longas e passphrases são bem-vindas; não exigimos símbolos ou maiúsculas (SPEC §9).
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

const email = z.email("Informe um e-mail válido.").trim().toLowerCase().max(254);

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres. Uma frase curta funciona bem.`)
  .max(PASSWORD_MAX_LENGTH, `Use no máximo ${PASSWORD_MAX_LENGTH} caracteres.`);

const currentPassword = z.string().min(1, "Informe sua senha.").max(PASSWORD_MAX_LENGTH);

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Como podemos te chamar?").max(80, "Use até 80 caracteres."),
  email,
  password: newPassword,
  ageConfirmed: z.boolean().refine((value) => value, "É preciso ter 18 anos ou mais para usar o Ritmo."),
});

export const loginSchema = z.object({ email, password: currentPassword });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não são iguais.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({ currentPassword, newPassword, revokeOtherSessions: z.boolean() })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "A nova senha precisa ser diferente da atual.",
    path: ["newPassword"],
  });

export const deleteAccountSchema = z.object({
  password: currentPassword,
  confirmation: z.string().refine((value) => value.trim() === "EXCLUIR", 'Digite "EXCLUIR" para confirmar.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
