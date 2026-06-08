import Link from "next/link";
import { Crown, LockKeyhole, ShieldCheck } from "lucide-react";
import { canSeeAdminGuidance, privateNavigation } from "@/lib/navigation";
import { getModuleAccess } from "@/lib/plans";
import { isSuperadmin } from "@/lib/superadmin";

export async function MobileNav() {
  const [{ access, current }, superadmin] = await Promise.all([
    getModuleAccess(),
    isSuperadmin(),
  ]);

  return (
    <div className="border-b border-stone-200 bg-stone-50 px-4 py-4 lg:hidden">
      <div className="flex items-center justify-between">
        <Link href="/app/dashboard" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-stone-950 text-white">
            <Crown size={17} />
          </span>
          <span className="text-sm font-semibold text-stone-950">Royalty OS</span>
        </Link>
        {superadmin ? (
          <Link
            href="/superadmin"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600"
            aria-label="Superadmin"
            title="Superadmin"
          >
            <ShieldCheck size={16} />
          </Link>
        ) : null}
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {privateNavigation.filter((item) => !item.adminOnly || canSeeAdminGuidance(current.role)).map((item) => {
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
