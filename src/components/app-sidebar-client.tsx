"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, LockKeyhole, PanelLeftClose, ShieldCheck } from "lucide-react";
import { privateNavigation } from "@/lib/navigation";

export function AppSidebarClient({
  businessName,
  plan,
  access,
  isSuperadmin,
}: {
  businessName: string;
  plan: string;
  access: Record<string, boolean>;
  isSuperadmin: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-stone-200 bg-stone-50/95 px-4 py-5 lg:flex lg:flex-col">
      <div className="flex items-center justify-between px-2">
        <Link href="/app/dashboard" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-stone-950 text-white">
            <Crown size={19} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-stone-950">
              Royalty OS
            </span>
            <span className="block text-xs text-stone-500">Hospitality suite</span>
          </span>
        </Link>
        <button
          className="flex size-9 items-center justify-center rounded-lg text-stone-500 transition hover:bg-white hover:text-stone-950"
          aria-label="Contraer sidebar"
          title="Contraer sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {privateNavigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const unlocked = access[item.moduleKey] ?? true;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                active
                  ? "bg-stone-950 text-white shadow-sm"
                  : "text-stone-600 hover:bg-white hover:text-stone-950",
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
      </nav>

      {isSuperadmin ? (
        <Link
          href="/superadmin"
          className="mb-3 flex h-11 items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-950"
        >
          <ShieldCheck size={18} />
          <span className="min-w-0 flex-1 truncate">Superadmin</span>
        </Link>
      ) : null}

      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
          Tenant activo
        </p>
        <p className="mt-2 text-sm font-semibold text-stone-950">
          {businessName}
        </p>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          Plan {plan}. Los modulos bloqueados muestran upgrade sin ocultarse.
        </p>
      </div>
    </aside>
  );
}
