"use server";

import { redirect } from "next/navigation";

import { signInSchema, signUpSchema } from "@/lib/validation/auth";
import { createClient } from "@/utils/supabase/server";

function loginRedirect(kind: "error" | "message", message: string): never {
  redirect(`/login?${kind}=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    loginRedirect(
      "error",
      parsed.error.issues[0]?.message ?? "Dados inválidos.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    loginRedirect("error", "Não foi possível entrar. Confira e-mail e senha.");
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    loginRedirect(
      "error",
      parsed.error.issues[0]?.message ?? "Dados inválidos.",
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
    },
  });

  if (error) {
    loginRedirect("error", "Não foi possível criar a conta.");
  }

  if (!data.session) {
    loginRedirect(
      "message",
      "Conta criada. Confirme o e-mail para acessar seu espaço.",
    );
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
