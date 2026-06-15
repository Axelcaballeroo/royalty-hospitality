"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Crown, LockKeyhole, PanelLeftClose } from "lucide-react";
import { footerNavigation, navigationGroups } from "@/lib/navigation";

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
  const activeGroup = navigationGroups.find((group) =>
    group.items.some((item) => {
      const href = item.href.split("?")[0];
      return pathname === href || pathname.startsWith(`${href}/`);
    }),
  )?.label;
  const [openGroup, setOpenGroup] = useState(activeGroup ?? "Operacion");

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
                    ? "bg-stone-950 text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-950",
                ].join(" ")}
              >
                <GroupIcon size={17} />
                <span className="min-w-0 flex-1 text-left">{group.label}</span>
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
                  const Icon = item.icon;
                  const href = item.href.split("?")[0];
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  const unlocked = access[item.moduleKey] ?? true;

                  return (
                    <Link
                      key={`${group.label}-${item.href}-${item.name}`}
                      href={item.href}
                      prefetch={false}
                      onClick={() => setOpenGroup(group.label)}
                      className={[
                        "flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition",
                        active
                          ? "bg-stone-100 text-stone-950"
                          : "text-stone-600 hover:bg-stone-100 hover:text-stone-950",
                      ].join(" ")}
                    >
                      <Icon size={14} />
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      {!unlocked ? (
                        <span className="text-stone-400" title="Upgrade">
                          <LockKeyhole size={13} />
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
                </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-5 border-t border-stone-200 pt-4">
        {footerNavigation.map((item) => {
            const Icon = item.icon;
            const href = item.href.split("?")[0];
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const unlocked = access[item.moduleKey] ?? true;
            const showChildren = active || item.children?.some((child) => {
              const childHref = child.href.split("?")[0];
              return pathname === childHref || pathname.startsWith(`${childHref}/`);
            });

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
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
                {showChildren && item.children?.length ? (
                  <div className="ml-6 mt-1 grid gap-1 border-l border-stone-200 pl-3">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childHref = child.href.split("?")[0];
                      const childActive = pathname === childHref || pathname.startsWith(`${childHref}/`);

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          prefetch={false}
                          className={[
                            "flex h-8 items-center gap-2 rounded-lg px-2 text-xs font-medium transition",
                            childActive
                              ? "bg-stone-100 text-stone-950"
                              : "text-stone-500 hover:bg-stone-100 hover:text-stone-950",
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

      <div className="mt-5 px-3">
        <p className="truncate text-sm font-semibold text-stone-950">{businessName}</p>
        <p className="mt-1 text-xs font-medium text-stone-400">Plan {plan}</p>
      </div>
    </aside>
  );
}
