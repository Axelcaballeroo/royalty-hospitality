import { getModuleAccess } from "@/lib/plans";
import { AppSidebarClient } from "@/components/app-sidebar-client";

export async function AppSidebar() {
  const { current, plan, access } = await getModuleAccess();

  return (
    <AppSidebarClient
      businessName={current.business.name}
      plan={plan}
      access={access}
    />
  );
}
