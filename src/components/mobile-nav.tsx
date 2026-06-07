import Link from "next/link";
import { Crown, LockKeyhole } from "lucide-react";
import { privateNavigation } from "@/lib/navigation";
import { getModuleAccess } from "@/lib/plans";

export async function MobileNav() {
  const { access } = await getModuleAccess();

  return (
    <div className="border-b border-stone-200 bg-stone-50 px-4 py-4 lg:hidden">
      <div className="flex items-center justify-between">
        <Link href="/app/dashboard" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-stone-950 text-white">
            <Crown size={17} />
          </span>
          <span className="text-sm font-semibold text-stone-950">Royalty OS</span>
        </Link>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {privateNavigation.map((item) => {
          const unlocked = access[item.moduleKey] ?? true;
          return (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600"
          >
            {item.name}
            {!unlocked ? <LockKeyhole size={12} /> : null}
          </Link>
          );
        })}
      </div>
    </div>
  );
}
