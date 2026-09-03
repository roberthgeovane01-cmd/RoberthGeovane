import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todos")
    .select("id, name, is_complete")
    .order("id");

  const todos = data ?? [];

  return (
    <main className="min-h-screen bg-[#f5f0e5] px-6 py-16 text-[#17233e] sm:px-10">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-[#17233e]/10 bg-white shadow-[0_24px_80px_rgba(23,35,62,0.12)]">
        <header className="border-b border-[#17233e]/10 px-7 py-8 sm:px-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#a6751d]">
            Memória antes da escrita
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Memória Reflexiva
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-[#637083]">
            A conexão SSR com o Supabase está ativa. Esta lista é carregada no
            servidor e usa o proxy do Next.js para manter futuras sessões
            atualizadas.
          </p>
        </header>

        <div className="px-7 py-8 sm:px-10">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Primeiros marcos</h2>
            <span className="rounded-full bg-[#536a5b]/10 px-3 py-1 text-xs font-semibold text-[#536a5b]">
              Supabase conectado
            </span>
          </div>

          {error ? (
            <div className="rounded-2xl border border-[#8a3d32]/20 bg-[#8a3d32]/5 p-5 text-sm leading-6 text-[#8a3d32]">
              Não foi possível consultar a tabela <code>todos</code>: {error.message}
            </div>
          ) : todos.length > 0 ? (
            <ul className="space-y-3">
              {todos.map((todo) => (
                <li
                  className="flex items-center gap-3 rounded-2xl border border-[#17233e]/10 px-4 py-4"
                  key={todo.id}
                >
                  <span
                    aria-hidden="true"
                    className={`grid size-6 place-items-center rounded-full text-xs text-white ${
                      todo.is_complete ? "bg-[#536a5b]" : "bg-[#a6751d]"
                    }`}
                  >
                    {todo.is_complete ? "✓" : "•"}
                  </span>
                  <span className="font-medium">{todo.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl bg-[#17233e]/5 p-5 text-sm text-[#637083]">
              A tabela está conectada e ainda não possui itens.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
