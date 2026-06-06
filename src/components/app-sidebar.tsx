"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, PanelLeftClose } from "lucide-react";
import { privateNavigation } from "@/lib/navigation";

export function AppSidebar() {
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
          const active = pathname === item.href;

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
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
          Tenant activo
        </p>
        <p className="mt-2 text-sm font-semibold text-stone-950">
          Demo Restaurant Group
        </p>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          Arquitectura lista para multiples negocios, usuarios y modulos.
        </p>
      </div>
    </aside>
  );
}
