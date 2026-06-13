import { getModuleAccess } from "@/lib/plans";
import { MobileNavClient } from "@/components/mobile-nav-client";

export async function MobileNav() {
  const { access, current } = await getModuleAccess();

  if (!current) {
    return null;
  }

  return <MobileNavClient access={access} />;
}
