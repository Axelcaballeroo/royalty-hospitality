"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Bell, Crown, LockKeyhole, Menu, Plus, X } from "lucide-react";
import { useState } from "react";
import { appNavigation } from "@/lib/navigation";

export function MobileNavClient({
  access,
  alertCount,
}: {
  access: Record<string, boolean>;
  alertCount: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function isActive(href: string) {
    const [path, query] = href.split("?");

    if (pathname !== path && !pathname.startsWith(`${path}/`)) {
      return false;
    }

    if (!query) {
      return path === "/app/operacion"
        ? !searchParams.get("tab") || searchParams.get("tab") === "hoy"
        : true;
    }

    const itemParams = new URLSearchParams(query);
    return Array.from(itemParams.entries()).every(
      ([key, value]) => searchParams.get(key) === value,
    );
  }

  return (
    <div className="border-b border-stone-200/80 bg-white/90 px-4 py-4 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between">
        <Link href="/app/operacion" className="flex items-center gap-3" prefetch={false}>
          <span className="flex size-10 items-center justify-center rounded-2xl bg-stone-950 text-white">
            <Crown size={17} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-stone-950">Royalty OS</span>
            <span className="block text-xs text-stone-500">Operacion diaria</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/app/reservas?new=1"
            className="inline-flex size-10 items-center justify-center rounded-xl bg-stone-950 text-white"
            aria-label="Crear" prefetch={false}>
            <Plus size={18} />
          </Link>
          <Link
            href="/app/alertas"
            className="relative inline-flex size-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700"
            aria-label="Alertas" prefetch={false}>
            <Bell size={18} />
            {alertCount ? (
              <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-stone-950 px-1.5 text-[10px] font-bold text-white">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700"
            aria-label="Abrir navegacion"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="mt-4 grid max-h-[75vh] gap-1 overflow-y-auto pb-2">
          {appNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const unlocked = access[item.moduleKey] ?? true;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => setOpen(false)}
                className={[
                  "flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition",
                  active
                    ? "bg-stone-950 text-white"
                    : "bg-white text-stone-700 hover:bg-stone-100",
                ].join(" ")}
              >
                <Icon size={17} />
                <span className="min-w-0 flex-1 truncate text-left">{item.name}</span>
                {!unlocked ? <LockKeyhole size={12} /> : null}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
