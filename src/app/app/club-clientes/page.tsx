import { headers } from "next/headers";
import { updatePublicWebsiteSettingsAction } from "@/app/app/actions";
import { PublicLinkActions } from "@/components/public-link-actions";
import { ModuleCard, SectionHeader } from "@/components/ui";
import { getBusinessSettingsData } from "@/lib/data";
import { formatEventType } from "@/lib/formatters";

export const dynamic = "force-dynamic";

const fieldClass =
  "h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

export default async function CustomerClubPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const { current } = await getBusinessSettingsData();
  const business = current.business;
  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const origin = host ? `${protocol}://${host}` : "";
  const clubLink = `${origin}/club/${business.slug}`;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Clientes"
        title="Club de clientes"
        description="Configura la presencia visual del club antes de activar una experiencia publica completa."
      />

      {params.error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formatEventType(params.error)}</p> : null}
      {params.success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{formatEventType(params.success)}</p> : null}

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ModuleCard title="Configuracion visual" description="Logo, nombre, colores y mensaje de bienvenida del club.">
          <form action={updatePublicWebsiteSettingsAction} className="grid gap-3">
            <input type="hidden" name="return_to" value="/app/club-clientes" />
            <input type="hidden" name="cover_url" value={business.cover_url ?? ""} />
            <input type="hidden" name="phone" value={business.phone ?? ""} />
            <input type="hidden" name="email" value={business.email ?? ""} />
            <input type="hidden" name="address" value={business.address ?? ""} />
            <input type="hidden" name="city" value={business.city ?? ""} />
            <input type="hidden" name="country" value={business.country ?? ""} />
            <input type="hidden" name="instagram_url" value={business.instagram_url ?? ""} />
            <input type="hidden" name="facebook_url" value={business.facebook_url ?? ""} />
            <input type="hidden" name="whatsapp_url" value={business.whatsapp_url ?? ""} />
            <input type="hidden" name="website_enabled" value="on" />
            <input type="hidden" name="reservation_enabled" value={business.reservation_enabled ? "on" : ""} />
            <input name="logo_url" defaultValue={business.logo_url ?? ""} placeholder="Logo URL" className={fieldClass} />
            <input name="club_name" defaultValue={`Club ${business.name}`} placeholder="Nombre del club" className={fieldClass} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="brand_primary_color" defaultValue={business.brand_primary_color ?? "#1c1917"} placeholder="Color principal" className={fieldClass} />
              <input name="brand_secondary_color" defaultValue={business.brand_secondary_color ?? "#10b981"} placeholder="Color secundario" className={fieldClass} />
            </div>
            <textarea
              name="public_description"
              defaultValue={business.public_description ?? `Bienvenido al club de ${business.name}. Acumula puntos y recibe beneficios.`}
              placeholder="Mensaje de bienvenida"
              className="min-h-24 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400"
            />
            <button className="h-11 rounded-xl bg-stone-950 text-sm font-semibold text-white transition hover:bg-stone-800">
              Guardar club
            </button>
          </form>
        </ModuleCard>

        <ModuleCard title="Preview del club" description="Vista administrativa de como se comunica el club.">
          <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
            <div
              className="rounded-3xl p-6 text-white"
              style={{ background: business.brand_primary_color ?? "#1c1917" }}
            >
              <p className="text-sm opacity-70">Club de clientes</p>
              <h2 className="mt-3 text-3xl font-semibold">Club {business.name}</h2>
              <p className="mt-4 max-w-md text-sm leading-6 opacity-80">
                {business.public_description ?? "Acumula puntos en cada visita y canjea beneficios."}
              </p>
            </div>
            <div className="mt-4">
              <PublicLinkActions href={clubLink} />
            </div>
          </div>
        </ModuleCard>
      </section>
    </div>
  );
}
