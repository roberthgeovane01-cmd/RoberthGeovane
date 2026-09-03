import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { workspaceNavigation } from "@/lib/constants/navigation";

type AppShellProps = {
  children: ReactNode;
  logoutAction: () => Promise<void>;
  userEmail?: string;
  workspaceName: string;
};

export function AppShell({
  children,
  logoutAction,
  userEmail,
  workspaceName,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f5f0e5] text-[#17233e] lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-[#17233e]/10 bg-[#17233e] px-5 py-5 text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:px-6 lg:py-8">
        <Link className="block" href="/dashboard">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d4ae67]">
            Memória antes da escrita
          </span>
          <span className="mt-2 block text-xl font-semibold">
            Memória Reflexiva
          </span>
        </Link>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-white/55">
            Espaço
          </p>
          <p className="mt-1 truncate font-semibold">{workspaceName}</p>
          {userEmail ? (
            <p className="mt-1 truncate text-xs text-white/55">{userEmail}</p>
          ) : null}
        </div>

        <nav
          aria-label="Navegação principal"
          className="mt-5 overflow-x-auto lg:overflow-visible"
        >
          <ul className="flex gap-2 pb-2 lg:block lg:space-y-1 lg:pb-0">
            {workspaceNavigation.map(({ href, icon: Icon, label }) => (
              <li className="shrink-0" key={href}>
                <Link
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4ae67]"
                  href={href}
                >
                  <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <form
          action={logoutAction}
          className="mt-4 lg:absolute lg:bottom-7 lg:left-6 lg:right-6"
        >
          <Button
            className="w-full border-white/15 bg-transparent text-white hover:bg-white/10"
            type="submit"
            variant="secondary"
          >
            Sair
          </Button>
        </form>
      </aside>

      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        {children}
      </main>
    </div>
  );
}
