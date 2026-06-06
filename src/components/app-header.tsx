import Link from "next/link";
import { Bell, LogOut, Search } from "lucide-react";

export function AppHeader() {
  return (
    <header className="hidden border-b border-stone-200 bg-white/85 px-8 py-4 backdrop-blur lg:block">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Workspace
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-950">
            Demo Restaurant Group
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex h-10 w-80 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm text-stone-500">
            <Search size={16} />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
              placeholder="Buscar cliente, reserva o tarea"
            />
          </label>
          <button
            className="flex size-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:text-stone-950"
            aria-label="Alertas"
            title="Alertas"
          >
            <Bell size={17} />
          </button>
          <Link
            href="/logout"
            className="flex size-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:text-stone-950"
            aria-label="Cerrar sesion"
            title="Cerrar sesion"
          >
            <LogOut size={17} />
          </Link>
          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-600">
            Supabase Auth preparado
          </div>
        </div>
      </div>
    </header>
  );
}
