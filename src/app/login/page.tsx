import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { login, signup } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f0e5] px-6 py-12 text-[#17233e]">
      <section className="w-full max-w-md rounded-[2rem] border border-[#17233e]/10 bg-white p-7 shadow-[0_24px_80px_rgba(23,35,62,0.12)] sm:p-9">
        <Link
          className="text-xs font-semibold uppercase tracking-[0.28em] text-[#a6751d]"
          href="/"
        >
          Memória Reflexiva
        </Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          Entre no seu espaço
        </h1>
        <p className="mt-3 leading-7 text-[#637083]">
          Sua biblioteca, suas memórias e suas reflexões permanecem isoladas por
          workspace.
        </p>

        {error ? (
          <p
            className="mt-6 rounded-xl border border-[#8a3d32]/20 bg-[#8a3d32]/5 p-4 text-sm text-[#8a3d32]"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {message ? (
          <p
            className="mt-6 rounded-xl border border-[#536a5b]/20 bg-[#536a5b]/5 p-4 text-sm text-[#536a5b]"
            role="status"
          >
            {message}
          </p>
        ) : null}

        <form className="mt-7 space-y-5">
          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="fullName"
            >
              Nome
            </label>
            <Input
              autoComplete="name"
              id="fullName"
              maxLength={120}
              name="fullName"
              placeholder="Como você quer ser chamado"
              type="text"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="email">
              E-mail
            </label>
            <Input
              autoComplete="email"
              id="email"
              name="email"
              placeholder="voce@exemplo.com"
              required
              type="email"
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="password"
            >
              Senha
            </label>
            <Input
              autoComplete="current-password"
              id="password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button formAction={login} type="submit">
              Entrar
            </Button>
            <Button formAction={signup} type="submit" variant="secondary">
              Criar conta
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
