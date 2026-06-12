import { getModuleAccess } from "@/lib/plans";
import { isSuperadmin } from "@/lib/superadmin";
import { AppSidebarClient } from "@/components/app-sidebar-client";

export async function AppSidebar() {
  const [{ current, plan, access }, superadmin] = await Promise.all([
    getModuleAccess(),
    isSuperadmin(),
  ]);

  if (!current) {
    return null;
  }

  return (
    <AppSidebarClient
      businessName={current.business.name}
      plan={plan}
      access={access}
      isSuperadmin={superadmin}
      role={current.role}
    />
  );
}
