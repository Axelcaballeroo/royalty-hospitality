"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Crown, LockKeyhole, PanelLeftClose } from "lucide-react";
import { appNavigation } from "@/lib/navigation";

export function AppSidebarClient({
  businessName,
  plan,
  access,
}: {
  businessName: string;
  plan: string;
  access: Record<string, boolean>;
}) {
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
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-stone-200/70 bg-white/95 px-5 py-6 shadow-[20px_0_60px_rgba(28,25,23,0.04)] backdrop-blur lg:flex lg:flex-col">
      <div className="flex items-center justify-between px-2">
        <Link href="/app/operacion" className="flex items-center gap-3" prefetch={false}>
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

      <nav className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {appNavigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const unlocked = access[item.moduleKey] ?? true;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={[
                "flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition",
                active
                  ? "bg-stone-950 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-950",
              ].join(" ")}
            >
              <Icon size={17} />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              {!unlocked ? (
                <span className={active ? "text-white/70" : "text-stone-400"} title="Upgrade">
                  <LockKeyhole size={13} />
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 px-3">
        <p className="truncate text-sm font-semibold text-stone-950">{businessName}</p>
        <p className="mt-1 text-xs font-medium text-stone-400">Plan {plan}</p>
      </div>
    </aside>
  );
}
