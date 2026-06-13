import Link from "next/link";
import { headers } from "next/headers";
import { ExternalLink } from "lucide-react";
import {
  updateBusinessProfileAction,
  updateBusinessSettingsAction,
  updateBusinessUserAction,
  updatePublicWebsiteSettingsAction,
} from "@/app/app/actions";
import { getBusinessSettingsData } from "@/lib/data";
import { ModuleCard, StatusBadge } from "@/components/ui";
import { PublicLinkActions } from "@/components/public-link-actions";
import { getModuleAccess, moduleCatalog, planModules } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const { current, hours, modules, settings, users } = await getBusinessSettingsData();
  const { plan, access } = await getModuleAccess();
  const business = current.business;
  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const origin = host ? `${protocol}://${host}` : "";
  const publicLinks = [
    { label: "Link del Club", href: `${origin}/club/${business.slug}` },
    { label: "Link de Reservas", href: `${origin}/site/${business.slug}/reservas` },
    { label: "Link Web publica", href: `${origin}/site/${business.slug}` },
  ];
  const includedModules = planModules[plan];
  const blockedModules = Object.keys(moduleCatalog).filter((moduleKey) => !access[moduleKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            Configuracion
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-950">
            Datos del negocio y web publica
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Configura el perfil publico del restaurante. Royalty opera como infraestructura; esta web pertenece al negocio.
          </p>
        </div>
        <Link
          href={`/site/${business.slug}`}
          target="_blank"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          Ver web publica
          <ExternalLink size={16} />
        </Link>
      </div>

      {params.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p> : null}
      {params.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{params.success}</p> : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ModuleCard title="Perfil del negocio" description="Datos internos principales del tenant.">
          <form action={updateBusinessProfileAction} className="grid gap-3">
            <input required name="name" defaultValue={business.name} placeholder="Nombre" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="type" defaultValue={business.type ?? ""} placeholder="Tipo" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="timezone" defaultValue={business.timezone} placeholder="Timezone" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="phone" defaultValue={business.phone ?? ""} placeholder="Telefono" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="email" type="email" defaultValue={business.email ?? ""} placeholder="Email" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="address" defaultValue={business.address ?? ""} placeholder="Direccion" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="city" defaultValue={business.city ?? ""} placeholder="Ciudad" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="country" defaultValue={business.country ?? ""} placeholder="Pais" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            </div>
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white">Guardar perfil</button>
          </form>
        </ModuleCard>

        <ModuleCard title="Preferencias" description="Reglas operativas V1 en business_settings.">
          <form action={updateBusinessSettingsAction} className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="currency" defaultValue={settings?.currency ?? "MXN"} placeholder="Moneda" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="timezone" defaultValue={settings?.timezone ?? business.timezone} placeholder="Timezone" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="points_per_currency" type="number" step="0.01" defaultValue={settings?.points_per_currency ?? 1} placeholder="Puntos por consumo" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="reservation_interval_minutes" type="number" min="5" defaultValue={settings?.reservation_interval_minutes ?? 30} placeholder="Intervalo reservas" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-medium text-stone-700">
              <input name="reservation_auto_confirmed" type="checkbox" defaultChecked={settings?.reservation_auto_confirmed ?? false} />
              Reservas auto-confirmadas
            </label>
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white">Guardar preferencias</button>
          </form>
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ModuleCard title="Web publica" description="Branding, contacto, redes y activacion de reservas publicas.">
          <form action={updatePublicWebsiteSettingsAction} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-medium text-stone-700">
                <input name="website_enabled" type="checkbox" defaultChecked={business.website_enabled ?? true} />
                Web publica activa
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-medium text-stone-700">
                <input name="reservation_enabled" type="checkbox" defaultChecked={business.reservation_enabled ?? true} />
                Reservas publicas activas
              </label>
            </div>

            <textarea
              name="public_description"
              defaultValue={business.public_description ?? ""}
              placeholder="Descripcion publica del negocio"
              className="min-h-28 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <input name="logo_url" defaultValue={business.logo_url ?? ""} placeholder="Logo URL" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="cover_url" defaultValue={business.cover_url ?? ""} placeholder="Cover URL" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="brand_primary_color" defaultValue={business.brand_primary_color ?? "#1c1917"} placeholder="#1c1917" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="brand_secondary_color" defaultValue={business.brand_secondary_color ?? "#10b981"} placeholder="#10b981" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="phone" defaultValue={business.phone ?? ""} placeholder="Telefono" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="email" type="email" defaultValue={business.email ?? ""} placeholder="Email" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="address" defaultValue={business.address ?? ""} placeholder="Direccion" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="city" defaultValue={business.city ?? ""} placeholder="Ciudad" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="country" defaultValue={business.country ?? ""} placeholder="Pais" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="instagram_url" defaultValue={business.instagram_url ?? ""} placeholder="Instagram URL" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="facebook_url" defaultValue={business.facebook_url ?? ""} placeholder="Facebook URL" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
              <input name="whatsapp_url" defaultValue={business.whatsapp_url ?? ""} placeholder="WhatsApp URL" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            </div>

            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Guardar web publica
            </button>
          </form>
        </ModuleCard>

        <div className="space-y-4">
          <ModuleCard title="Links publicos" description="Accesos listos para compartir con clientes y staff.">
            <div className="grid gap-3">
              {publicLinks.map((item) => (
                <div key={item.href} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <p className="text-sm font-semibold text-stone-950">{item.label}</p>
                  <p className="mt-1 break-all text-xs text-stone-500">{item.href}</p>
                  <div className="mt-3">
                    <PublicLinkActions href={item.href} />
                  </div>
                </div>
              ))}
            </div>
          </ModuleCard>
          <ModuleCard title="Plan contratado" description="Informacion actual del tenant.">
            <div className="space-y-4 text-sm text-stone-600">
              <p><span className="font-medium text-stone-950">Slug:</span> {business.slug}</p>
              <p className="flex items-center justify-between gap-3">
                <span><span className="font-medium text-stone-950">Plan:</span> {business.plan}</span>
                <StatusBadge status={plan} />
              </p>
              <p><span className="font-medium text-stone-950">Timezone:</span> {business.timezone}</p>
              <button className="h-10 w-full rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
                Mejorar plan
              </button>
              <p className="text-xs leading-5 text-stone-500">
                Preparado para que un superadmin cambie el plan manualmente en una fase futura.
              </p>
            </div>
          </ModuleCard>
          <ModuleCard title="Modulos incluidos por plan" description="Lo que el plan permite comercialmente.">
            <div className="grid gap-2">
              {includedModules.map((moduleKey) => (
                <div key={moduleKey} className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                  <span className="text-sm font-medium text-stone-700">{moduleCatalog[moduleKey]?.name ?? moduleKey}</span>
                  <StatusBadge status="active" />
                </div>
              ))}
            </div>
          </ModuleCard>
          <ModuleCard title="Modulos bloqueados" description="Oportunidades claras de upgrade.">
            <div className="grid gap-2">
              {blockedModules.length ? blockedModules.map((moduleKey) => (
                <div key={moduleKey} className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                  <span className="text-sm font-medium text-stone-700">{moduleCatalog[moduleKey]?.name ?? moduleKey}</span>
                  <StatusBadge status={moduleCatalog[moduleKey]?.requiredPlan ?? "pro"} />
                </div>
              )) : <p className="text-sm text-stone-500">Todos los modulos del catalogo estan disponibles.</p>}
            </div>
          </ModuleCard>
          <ModuleCard title="Modulos activos" description="business_modules del negocio.">
            <div className="grid gap-2">
              {modules.map((module) => (
                <div key={module.module_key} className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                  <span className="text-sm font-medium text-stone-700">{module.module_key}</span>
                  <StatusBadge status={module.enabled ? "active" : "inactive"} />
                </div>
              ))}
            </div>
          </ModuleCard>
          <ModuleCard title="Usuarios" description="Gestion manual V1 de business_users.">
            <div className="grid gap-3">
              {users.map((user) => (
                <form key={user.id} action={updateBusinessUserAction} className="grid gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <input type="hidden" name="membership_id" value={user.id} />
                  <p className="text-xs font-medium text-stone-500">{user.user_id}</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select name="role" defaultValue={user.role} className="h-10 rounded-lg border border-stone-200 bg-white px-2 text-xs outline-none">
                      {["superadmin", "owner", "manager", "staff"].map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <select name="status" defaultValue={user.status} className="h-10 rounded-lg border border-stone-200 bg-white px-2 text-xs outline-none">
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select>
                    <button className="h-10 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-800">Guardar</button>
                  </div>
                </form>
              ))}
              <button className="h-10 rounded-lg bg-stone-950 text-sm font-medium text-white">
                Invitar usuario (placeholder)
              </button>
            </div>
          </ModuleCard>
          <ModuleCard title="Horarios" description="Se mostraran en la web publica cuando existan.">
            <div className="space-y-2 text-sm text-stone-600">
              {hours.length ? hours.map((hour) => (
                <p key={hour.day_of_week}>
                  Dia {hour.day_of_week}: {hour.is_closed ? "Cerrado" : `${hour.opens_at} - ${hour.closes_at}`}
                </p>
              )) : <p>Sin horarios configurados.</p>}
            </div>
          </ModuleCard>
        </div>
      </section>
    </div>
  );
}
