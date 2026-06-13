"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, LockKeyhole, PanelLeftClose, ShieldCheck } from "lucide-react";
import { canSeeAdminGuidance, privateNavigation, secondaryNavigation } from "@/lib/navigation";

export function AppSidebarClient({
  businessName,
  plan,
  access,
  isSuperadmin,
  role,
}: {
  businessName: string;
  plan: string;
  access: Record<string, boolean>;
  isSuperadmin: boolean;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-80 shrink-0 border-r border-stone-200/70 bg-white/90 px-5 py-6 shadow-[20px_0_60px_rgba(28,25,23,0.04)] backdrop-blur lg:flex lg:flex-col">
      <div className="flex items-center justify-between px-2">
        <Link href="/app/operacion" className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-stone-950 text-white shadow-sm">
            <Crown size={19} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-stone-950">
              Royalty OS
            </span>
            <span className="block text-xs text-stone-500">Sistema operativo</span>
          </span>
        </Link>
        <button
          className="flex size-9 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-950"
          aria-label="Contraer sidebar"
          title="Contraer sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
          Operacion diaria
        </p>
        {privateNavigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const unlocked = access[item.moduleKey] ?? true;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition",
                active
                  ? "bg-stone-950 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-950",
              ].join(" ")}
            >
              <Icon size={18} />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              {!unlocked ? (
                <span className={active ? "text-white" : "text-stone-400"} title="Upgrade">
                  <LockKeyhole size={14} />
                </span>
              ) : null}
            </Link>
          );
        })}
        <div className="mt-6 border-t border-stone-200 pt-5">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Avanzado
          </p>
          {secondaryNavigation.filter((item) => !item.adminOnly || canSeeAdminGuidance(role)).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const unlocked = access[item.moduleKey] ?? true;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                  active
                    ? "bg-stone-100 text-stone-950"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-950",
                ].join(" ")}
              >
                <Icon size={16} />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                {!unlocked ? <LockKeyhole size={13} className="text-stone-400" /> : null}
              </Link>
            );
          })}
        </div>
      </nav>

      {isSuperadmin ? (
        <Link
          href="/superadmin"
          className="mb-3 flex h-11 items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-700 transition hover:border-stone-300 hover:text-stone-950"
        >
          <ShieldCheck size={18} />
          <span className="min-w-0 flex-1 truncate">Superadmin</span>
        </Link>
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
          Negocio activo
        </p>
        <p className="mt-2 text-sm font-semibold text-stone-950">
          {businessName}
        </p>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          Plan {plan}. Tu operacion diaria vive en un solo lugar.
        </p>
      </div>
    </aside>
  );
}
