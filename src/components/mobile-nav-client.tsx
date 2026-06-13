"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, LockKeyhole, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { privateNavigation } from "@/lib/navigation";

export function MobileNavClient({
  access,
  superadmin,
}: {
  access: Record<string, boolean>;
  role: string;
  superadmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="border-b border-stone-200/80 bg-white/90 px-4 py-4 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between">
        <Link href="/app/operacion" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-stone-950 text-white">
            <Crown size={17} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-stone-950">Royalty OS</span>
            <span className="block text-xs text-stone-500">Operacion diaria</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {superadmin ? (
            <Link
              href="/superadmin"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600"
              aria-label="Superadmin"
              title="Superadmin"
            >
              <ShieldCheck size={16} />
            </Link>
          ) : null}
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
        <nav className="mt-4 grid gap-2">
          {privateNavigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const unlocked = access[item.moduleKey] ?? true;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={[
                  "inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold",
                  active
                    ? "border-stone-950 bg-stone-950 text-white"
                    : "border-stone-200 bg-white text-stone-700",
                ].join(" ")}
              >
                {item.name}
                {!unlocked ? <LockKeyhole size={12} /> : null}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
