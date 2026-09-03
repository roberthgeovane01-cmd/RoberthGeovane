export default function LibraryLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse" role="status">
      <span className="sr-only">Carregando Biblioteca</span>
      <div className="h-4 w-40 rounded bg-[#17233e]/10" />
      <div className="mt-4 h-11 w-80 max-w-full rounded bg-[#17233e]/10" />
      <div className="mt-9 grid gap-8 xl:grid-cols-2">
        <div className="h-72 rounded-[2rem] bg-white/70" />
        <div className="h-[30rem] rounded-[2rem] bg-white/70" />
      </div>
    </div>
  );
}
