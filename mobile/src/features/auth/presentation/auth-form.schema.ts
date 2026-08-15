import { z } from 'zod';

const email = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .email('Informe um e-mail válido.');

const password = z
  .string()
  .min(1, 'Informe sua senha.')
  .min(6, 'A senha deve ter pelo menos 6 caracteres.')
  .max(128, 'A senha deve ter no máximo 128 caracteres.');

export const loginSchema = z.object({ email, password });

export const signUpSchema = z
  .object({
    email,
    password,
    passwordConfirmation: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'As senhas não coincidem.',
  });

export const passwordResetSchema = z.object({ email });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;
