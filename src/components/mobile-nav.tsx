import { getModuleAccess } from "@/lib/plans";
import { MobileNavClient } from "@/components/mobile-nav-client";
import { getAssistantData } from "@/lib/data";

export async function MobileNav() {
  const [{ access, current }, assistant] = await Promise.all([
    getModuleAccess(),
    getAssistantData(),
  ]);

  if (!current) {
    return null;
  }

  return <MobileNavClient access={access} alertCount={assistant.counts.total} />;
}
