import Link from "next/link";
import { Bell, LogOut, Search, ShieldCheck } from "lucide-react";
import { requireCurrentBusiness } from "@/lib/current-business";
import { isSuperadmin } from "@/lib/superadmin";

export async function AppHeader() {
  const [current, superadmin] = await Promise.all([
    requireCurrentBusiness(),
    isSuperadmin(),
  ]);

  return (
    <header className="hidden border-b border-stone-200/80 bg-white/85 px-8 py-4 backdrop-blur lg:block">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Centro operativo
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-950">
            {current.business.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300"
          >
            Dashboard ejecutivo
          </Link>
          <label className="flex h-10 w-80 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-500">
            <span className="sr-only">Buscar en el negocio</span>
            <Search size={16} />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
              placeholder="Buscar cliente, reserva o tarea"
            />
          </label>
          <button
            className="flex size-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:text-stone-950"
            aria-label="Alertas"
            title="Alertas"
          >
            <Bell size={17} />
          </button>
          {superadmin ? (
            <Link
              href="/superadmin"
              className="flex size-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:text-stone-950"
              aria-label="Superadmin"
              title="Superadmin"
            >
              <ShieldCheck size={17} />
            </Link>
          ) : null}
          <Link
            href="/logout"
            className="flex size-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:border-stone-300 hover:text-stone-950"
            aria-label="Cerrar sesion"
            title="Cerrar sesion"
          >
            <LogOut size={17} />
          </Link>
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-600">
            Plan {current.business.plan}
          </div>
        </div>
      </div>
    </header>
  );
}
