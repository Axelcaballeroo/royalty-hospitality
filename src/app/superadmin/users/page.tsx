import { getSuperadminUsersData } from "@/lib/data";
import { DataTable, ModuleCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SuperadminUsersPage() {
  const { authUsers, memberships } = await getSuperadminUsersData();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">Usuarios</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Usuarios registrados</h1>
      </div>
      <ModuleCard title="Supabase Auth" description="Lectura global para soporte.">
        <DataTable
          columns={["User ID", "Email", "Creado"]}
          rows={authUsers.map((user) => [
            user.id,
            user.email ?? "-",
            user.created_at ? new Date(user.created_at).toLocaleDateString("es-MX") : "-",
          ])}
        />
      </ModuleCard>
      <ModuleCard title="Membresias" description="business_users por tenant.">
        <DataTable
          columns={["User ID", "Negocio", "Rol", "Estado"]}
          rows={memberships.map((membership) => {
            const business = Array.isArray(membership.businesses)
              ? membership.businesses[0]
              : membership.businesses;
            return [
              membership.user_id,
              business?.name ?? membership.business_id,
              <StatusBadge key="role" status={membership.role} />,
              <StatusBadge key="status" status={membership.status} />,
            ];
          })}
        />
      </ModuleCard>
    </div>
  );
}
