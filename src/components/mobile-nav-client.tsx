"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Crown, LockKeyhole, Menu, X } from "lucide-react";
import { useState } from "react";
import { footerNavigation, navigationGroups } from "@/lib/navigation";

export function MobileNavClient({
  access,
}: {
  access: Record<string, boolean>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const activeGroup = navigationGroups.find((group) =>
    group.items.some((item) => {
      const href = item.href.split("?")[0];
      return pathname === href || pathname.startsWith(`${href}/`);
    }),
  )?.label;
  const [openGroup, setOpenGroup] = useState(activeGroup ?? "Operacion");

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
          {navigationGroups.map((group) => {
            const GroupIcon = group.icon;
            const groupActive = group.items.some((item) => {
              const href = item.href.split("?")[0];
              return pathname === href || pathname.startsWith(`${href}/`);
            });
            const expanded = openGroup === group.label;

            return (
            <div key={group.label} className="py-0.5">
              <button
                type="button"
                onClick={() => setOpenGroup(expanded ? "" : group.label)}
                className={[
                  "flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold transition",
                  groupActive || expanded
                    ? "bg-stone-950 text-white"
                    : "bg-white text-stone-700 hover:bg-stone-100",
                ].join(" ")}
              >
                <GroupIcon size={17} />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown
                  size={16}
                  className={[
                    "transition-transform duration-200",
                    expanded ? "rotate-180" : "rotate-0",
                  ].join(" ")}
                />
              </button>
              <div
                className={[
                  "grid overflow-hidden transition-all duration-200 ease-out",
                  expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                ].join(" ")}
              >
                <div className="min-h-0">
                <div className="ml-4 mt-2 grid gap-1 border-l border-stone-200 pl-3">
                {group.items.map((item) => {
                  const href = item.href.split("?")[0];
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  const unlocked = access[item.moduleKey] ?? true;

                  return (
                    <Link
                      key={`${group.label}-${item.href}-${item.name}`}
                      href={item.href}
                      onClick={() => {
                        setOpenGroup(group.label);
                        setOpen(false);
                      }}
                      className={[
                        "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium",
                        active
                          ? "bg-stone-100 text-stone-950"
                          : "text-stone-600 hover:bg-stone-100",
                      ].join(" ")}
                    >
                      {item.name}
                      {!unlocked ? <LockKeyhole size={12} /> : null}
                    </Link>
                  );
                })}
                </div>
              </div>
              </div>
            </div>
          );
          })}

          <div className="mt-3 border-t border-stone-200 pt-3">
            <div className="grid gap-1">
              {footerNavigation.map((item) => {
                const Icon = item.icon;
                const href = item.href.split("?")[0];
                const active = pathname === href || pathname.startsWith(`${href}/`);
                const showChildren = active || item.children?.some((child) => {
                  const childHref = child.href.split("?")[0];
                  return pathname === childHref || pathname.startsWith(`${childHref}/`);
                });

                return (
                  <div key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={[
                        "inline-flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm font-medium",
                        active
                          ? "bg-stone-100 text-stone-950"
                          : "text-stone-600 hover:bg-stone-100",
                      ].join(" ")}
                    >
                      <Icon size={16} />
                      {item.name}
                    </Link>
                    {showChildren && item.children?.length ? (
                      <div className="ml-5 mt-1 grid gap-1 border-l border-stone-200 pl-3">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childHref = child.href.split("?")[0];
                          const childActive = pathname === childHref || pathname.startsWith(`${childHref}/`);

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setOpen(false)}
                              className={[
                                "inline-flex h-8 items-center gap-2 rounded-lg px-2 text-xs font-medium",
                                childActive
                                  ? "bg-stone-100 text-stone-950"
                                  : "text-stone-500 hover:bg-stone-100",
                              ].join(" ")}
                            >
                              <ChildIcon size={13} />
                              {child.name}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
