import { z } from "zod";

const email = z
  .string()
  .trim()
  .pipe(z.email("Informe um e-mail válido."))
  .transform((value) => value.toLowerCase());

export const signInSchema = z.object({
  email,
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(2, "Informe seu nome.").max(120),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
