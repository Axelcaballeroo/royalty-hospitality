import { getModuleAccess } from "@/lib/plans";
import { isSuperadmin } from "@/lib/superadmin";
import { MobileNavClient } from "@/components/mobile-nav-client";

export async function MobileNav() {
  const [{ access, current }, superadmin] = await Promise.all([
    getModuleAccess(),
    isSuperadmin(),
  ]);

  if (!current) {
    return null;
  }

  return <MobileNavClient access={access} role={current.role} superadmin={superadmin} />;
}
