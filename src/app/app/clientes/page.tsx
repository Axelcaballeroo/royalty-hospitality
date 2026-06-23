import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import {
  createCustomerAction,
  createRewardAction,
  updateBusinessSettingsAction,
  updatePublicWebsiteSettingsAction,
} from "@/app/app/actions";
import {
  getBusinessSettingsData,
  getCustomersData,
  getLoyaltyData,
} from "@/lib/data";
import {
  DataTable,
  EmptyState,
  ModuleCard,
  PrimaryButton,
  SectionHeader,
  StatCard,
  StatusBadge,
} from "@/components/ui";
import { PublicLinkActions } from "@/components/public-link-actions";
import { formatEventType, formatStatus } from "@/lib/formatters";
import { loyaltyTiers } from "@/lib/loyalty";
import { createQrDataUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

type CustomerTab = "perfiles" | "journey" | "fidelizacion" | "beneficios" | "registro";
type CustomerAction = "new" | "benefit" | undefined;

const fieldClass =
  "h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400";

const tabs: { key: CustomerTab; label: string }[] = [
  { key: "perfiles", label: "Perfiles" },
  { key: "journey", label: "Journey" },
  { key: "fidelizacion", label: "Fidelizacion" },
  { key: "beneficios", label: "Beneficios" },
  { key: "registro", label: "Registro" },
];

const benefitIdeas = [
  ["10% descuento", "250"],
  ["Postre gratis", "120"],
  ["Entrada VIP", "500"],
  ["Bebida gratis", "150"],
];

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: CustomerAction;
    error?: string;
    q?: string;
    status?: string;
    success?: string;
    tab?: CustomerTab;
    tag?: string;
  }>;
}) {
  const params = await searchParams;
  const activeTab: CustomerTab = tabs.some((tab) => tab.key === params.tab)
    ? params.tab ?? "perfiles"
    : "perfiles";
  const activeAction = params.action;
  const needsCustomers = activeTab === "perfiles" || activeTab === "journey";
  const needsLoyalty = activeTab === "journey" || activeTab === "fidelizacion" || activeTab === "beneficios";
  const needsSettings = activeTab === "fidelizacion" || activeTab === "registro";
  const [customersData, loyalty, settingsData] = await Promise.all([
    needsCustomers
      ? getCustomersData({
          q: params.q,
          status: params.status,
          tag: params.tag,
        })
      : null,
    needsLoyalty ? getLoyaltyData() : null,
    needsSettings ? getBusinessSettingsData() : null,
  ]);
  const customers = customersData?.customers ?? [];
  const stats = customersData?.stats ?? {
    activeCustomers: 0,
    inactiveCustomers: 0,
    pointsIssued: 0,
    totalCustomers: 0,
    vipCustomers: 0,
    visitsThisMonth: 0,
  };
  const current = settingsData?.current ?? customersData?.current ?? loyalty?.current;
  const settings = settingsData?.settings;
  const business = current?.business ?? {
    brand_primary_color: "#1c1917",
    brand_secondary_color: "#10b981",
    city: null,
    country: null,
    cover_url: null,
    email: null,
    id: "",
    instagram_url: null,
    facebook_url: null,
    logo_url: null,
    menu_pdf_url: null,
    name: "",
    phone: null,
    plan: "business",
    public_description: null,
    reservation_enabled: true,
    slug: "",
    status: "active",
    timezone: "America/Cancun",
    type: null,
    website_enabled: true,
    whatsapp_url: null,
    address: null,
  };
  const loyaltyData = loyalty ?? {
    accounts: [],
    rewards: [],
    transactions: [],
    summary: {
      bronze: 0,
      gold: 0,
      black: 0,
      pointsIssued: 0,
      pointsRedeemed: 0,
      registeredCustomers: 0,
      silver: 0,
      tierCounts: {
        black: 0,
        bronze: 0,
        gold: 0,
        silver: 0,
      },
    },
  };
  const tags = Array.from(new Set(customers.flatMap((customer) => customer.tags))).sort();
  const pointsPerCurrency = settings?.points_per_currency ?? 1;
  const pesosPerPoint = pointsPerCurrency > 0 ? Math.round(1 / pointsPerCurrency) : 100;
  const averageTier =
    Object.entries(loyaltyData.summary.tierCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] ?? "bronze";
  const minRewardPoints = loyaltyData.rewards
    .filter((reward) => reward.status === "active")
    .sort((a, b) => a.points_required - b.points_required)[0]?.points_required ?? 500;
  const customersWithReward = loyaltyData.accounts.filter((account) => account.points_balance >= minRewardPoints).length;
  const activeCustomers = stats.activeCustomers;
  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const origin = host ? `${protocol}://${host}` : "";
  const registerLink = business ? `${origin}/club/${business.slug}/registro` : "";
  const clubLink = business ? `${origin}/site/${business.slug}/club` : "";
  const qrDataUrl = activeTab === "registro" && registerLink ? await createQrDataUrl(registerLink) : "";

  const rows = customers.map((customer) => [
    <Link key="name" href={`/app/clientes/${customer.id}`} className="font-medium text-stone-950 hover:underline" prefetch={false}>
      {customer.full_name}
    </Link>,
    customer.phone ?? "-",
    customer.email ?? "-",
    customer.tags.length ? customer.tags.join(", ") : "-",
    String(customer.total_visits),
    customer.last_visit_at ? new Date(customer.last_visit_at).toLocaleDateString("es-MX") : "-",
    <StatusBadge key="status" status={customer.status} />,
    <Link key="detail" href={`/app/clientes/${customer.id}`} className="font-medium text-stone-950 hover:underline" prefetch={false}>
      Abrir perfil 360
    </Link>,
  ]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Clientes"
        title="Centro de Clientes"
        description="Perfiles, puntos, beneficios y registro del club en una sola pantalla."
        actions={
          <Link
            href="/app/clientes?action=new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800" prefetch={false}>
            <Plus size={16} />
            Nuevo cliente
          </Link>
        }
      />

      {params.error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formatEventType(params.error)}</p> : null}
      {params.success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{formatEventType(params.success)}</p> : null}

      <ModuleCard title="Acciones rapidas" description="Atajos para operar clientes sin aprender cinco modulos separados.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/app/clientes?action=new" className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 shadow-sm hover:bg-stone-50" prefetch={false}>
            Nuevo cliente
          </Link>
          <Link href="/app/checkin" className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 shadow-sm hover:bg-stone-50" prefetch={false}>
            Registrar consumo
          </Link>
          <Link href="/app/clientes?tab=beneficios&action=benefit" className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 shadow-sm hover:bg-stone-50" prefetch={false}>
            Crear beneficio
          </Link>
          <Link href="/app/clientes?tab=registro" className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800 shadow-sm hover:bg-stone-50" prefetch={false}>
            Ver QR
          </Link>
        </div>
      </ModuleCard>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-[0_12px_40px_rgba(28,25,23,0.04)]">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/app/clientes?tab=${tab.key}`}
            className={[
              "inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold transition",
              activeTab === tab.key
                ? "bg-stone-950 text-white"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-950",
            ].join(" ")} prefetch={false}>
            {tab.label}
          </Link>
        ))}
      </div>

      {activeAction === "new" ? (
        <ModuleCard title="Nuevo cliente" description="Crea una persona y deja listo su acceso al club y puntos.">
          <form id="nuevo-cliente" action={createCustomerAction} className="grid gap-3">
            <input type="hidden" name="return_to" value="/app/clientes" />
            <input required name="full_name" placeholder="Nombre completo" className={fieldClass} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="phone" placeholder="Telefono" className={fieldClass} />
              <input type="email" name="email" placeholder="Email" className={fieldClass} />
            </div>
            <input type="date" name="birthday" className={fieldClass} />
            <input name="tags" placeholder="Etiquetas separadas por coma" className={fieldClass} />
            <textarea name="notes" placeholder="Notas iniciales" className="min-h-24 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <div className="flex flex-wrap gap-2">
              <PrimaryButton>Crear cliente</PrimaryButton>
              <Link href="/app/clientes" className="inline-flex h-11 items-center rounded-xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-800" prefetch={false}>
                Cancelar
              </Link>
            </div>
          </form>
        </ModuleCard>
      ) : null}

      {activeTab === "perfiles" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Clientes totales" value={String(stats.totalCustomers)} detail="Personas registradas" tone="dark" />
            <StatCard title="Clientes VIP" value={String(stats.vipCustomers)} detail="Alta recurrencia o consumo" />
            <StatCard title="Clientes inactivos" value={String(stats.inactiveCustomers)} detail="Sin visita reciente" />
            <StatCard title="Visitas del mes" value={String(stats.visitsThisMonth)} detail="Reservas completadas" />
          </section>

          <ModuleCard title="Buscar clientes" description="Encuentra personas por nombre, telefono, email, estado o etiqueta.">
            <form className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">
              <input type="hidden" name="tab" value="perfiles" />
              <input name="q" defaultValue={params.q ?? ""} placeholder="Buscar cliente" className={fieldClass} />
              <select name="status" defaultValue={params.status ?? "all"} className={fieldClass}>
                <option value="all">Todos los estados</option>
                <option value="active">{formatStatus("active")}</option>
                <option value="inactive">{formatStatus("inactive")}</option>
              </select>
              <input name="tag" list="customer-tags" defaultValue={params.tag ?? ""} placeholder="Etiqueta" className={fieldClass} />
              <datalist id="customer-tags">
                {tags.map((tag) => <option key={tag} value={tag} />)}
              </datalist>
              <button className="h-11 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white">
                Aplicar
              </button>
            </form>
          </ModuleCard>

          <ModuleCard title="Perfiles" description="Abre el Perfil 360 para ver datos, historial, reservas, puntos, beneficios y notas internas.">
            {customers.length ? (
              <DataTable caption="Lista de clientes" columns={["Nombre", "Telefono", "Email", "Etiquetas", "Visitas", "Ultima visita", "Estado", "Perfil"]} rows={rows} />
            ) : (
              <EmptyState title="Sin clientes" description="Crea el primer cliente para iniciar historial, puntos y beneficios." />
            )}
          </ModuleCard>
        </div>
      ) : null}

      {activeTab === "journey" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-5">
            <StatCard title="Registrados" value={String(loyaltyData.summary.registeredCustomers)} detail="Con cuenta de club" tone="dark" />
            <StatCard title="Activos" value={String(activeCustomers)} detail="Visitaron en 30 dias" />
            <StatCard title="Con recompensa" value={String(customersWithReward)} detail="Pueden canjear" />
            <StatCard title="VIP" value={String(stats.vipCustomers)} detail="Frecuentes o alto gasto" />
            <StatCard title="Inactivos" value={String(stats.inactiveCustomers)} detail="Para recuperar" />
          </section>

          <ModuleCard title="Customer Journey" description="El recorrido completo del cliente, desde registro hasta nueva visita.">
            <div className="grid gap-3 md:grid-cols-6">
              {[
                ["1", "Registro", "Cliente entra al club por QR o link."],
                ["2", "Reserva", "La reserva queda conectada a su perfil."],
                ["3", "Check-in", "Staff busca por QR, telefono, nombre o codigo."],
                ["4", "Consumo", "Se registra consumo y se suman puntos."],
                ["5", "Beneficio", "Puede canjear cuando alcanza puntos."],
                ["6", "Regreso", "Marketing lo reactiva si se aleja."],
              ].map(([step, title, description]) => (
                <div key={title} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-stone-950 text-xs font-semibold text-white">
                    {step}
                  </span>
                  <p className="mt-4 text-sm font-semibold text-stone-950">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
                </div>
              ))}
            </div>
          </ModuleCard>

          <ModuleCard title="Acciones del journey" description="Mueve clientes de un paso al siguiente sin pensar en modulos.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Link href="/app/clientes?tab=registro" className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800" prefetch={false}>
                Compartir QR del club
              </Link>
              <Link href="/app/reservas?new=1" className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800" prefetch={false}>
                Crear reserva
              </Link>
              <Link href="/app/operacion?tab=sala" className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-800" prefetch={false}>
                Check-in / consumo
              </Link>
              <Link href="/app/marketing?segment=customers_near_reward&type=reward" className="inline-flex h-11 items-center justify-center rounded-2xl bg-stone-950 px-4 text-sm font-semibold text-white" prefetch={false}>
                Activar regreso
              </Link>
            </div>
          </ModuleCard>
        </div>
      ) : null}

      {activeTab === "fidelizacion" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Clientes activos" value={String(loyaltyData.summary.registeredCustomers)} detail="Con cuenta de puntos" tone="dark" />
            <StatCard title="Puntos emitidos" value={String(loyaltyData.summary.pointsIssued)} detail="Historico acumulado" />
            <StatCard title="Puntos canjeados" value={String(loyaltyData.summary.pointsRedeemed)} detail="Beneficios usados" />
            <StatCard title="Nivel promedio" value={formatStatus(averageTier)} detail="Nivel dominante" />
          </section>

          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <ModuleCard title="Regla de puntos" description={`Ejemplo actual: 1 punto cada $${pesosPerPoint}.`}>
              <form action={updateBusinessSettingsAction} className="grid gap-3">
                <input type="hidden" name="return_to" value="/app/clientes?tab=fidelizacion" />
                <input type="hidden" name="currency" value={settings?.currency ?? "MXN"} />
                <input type="hidden" name="timezone" value={settings?.timezone ?? business.timezone} />
                <input type="hidden" name="reservation_interval_minutes" value={settings?.reservation_interval_minutes ?? 30} />
                <label className="grid gap-1 text-sm font-medium text-stone-700">
                  Pesos por punto
                  <input required name="points_per_currency" type="number" min="0.01" step="0.01" defaultValue={pointsPerCurrency} className={fieldClass} />
                </label>
                <button className="h-11 rounded-xl bg-stone-950 text-sm font-semibold text-white">
                  Guardar regla
                </button>
              </form>
            </ModuleCard>

            <ModuleCard title="Niveles" description="Bronce, Plata, Oro y VIP para entender valor del cliente.">
              <div className="grid gap-3 md:grid-cols-2">
                {[...loyaltyTiers.slice(0, 3), { key: "black", min: 3000 }].map((tier) => (
                  <div key={tier.key} className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <StatusBadge status={tier.key === "black" ? "VIP" : tier.key} />
                    <span className="text-sm font-semibold text-stone-700">{tier.min}+ puntos</span>
                  </div>
                ))}
              </div>
            </ModuleCard>
          </section>

          <ModuleCard title="Vista previa del club" description="Logo, colores y mensaje de bienvenida en una sola vista.">
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <form action={updatePublicWebsiteSettingsAction} className="grid gap-3">
                <input type="hidden" name="return_to" value="/app/clientes?tab=fidelizacion" />
                <input type="hidden" name="cover_url" value={business.cover_url ?? ""} />
                <input type="hidden" name="menu_pdf_url" value={business.menu_pdf_url ?? ""} />
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
                <button className="h-11 rounded-xl bg-stone-950 text-sm font-semibold text-white">
                  Guardar club
                </button>
              </form>
              <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                <div className="rounded-3xl p-6 text-white" style={{ background: business.brand_primary_color ?? "#1c1917" }}>
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
            </div>
          </ModuleCard>
        </div>
      ) : null}

      {activeTab === "beneficios" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard title="Beneficios activos" value={String(loyaltyData.rewards.filter((reward) => reward.status === "active").length)} detail="Disponibles para canje" tone="dark" />
            <StatCard title="Canjes del mes" value={String(loyaltyData.summary.pointsRedeemed)} detail="Puntos canjeados" />
            <StatCard title="Clientes que canjearon" value={String(loyaltyData.transactions.filter((transaction) => transaction.type === "redeem").length)} detail="Movimientos recientes" />
          </section>

          {activeAction === "benefit" ? (
            <ModuleCard title="Nuevo beneficio" description="Crea un beneficio simple para que el cliente vuelva.">
              <form action={createRewardAction} className="grid gap-3">
                <input type="hidden" name="return_to" value="/app/clientes?tab=beneficios" />
                <input required name="name" placeholder="Nombre del beneficio" className={fieldClass} />
                <textarea name="description" placeholder="Descripcion para el equipo" className="min-h-20 rounded-xl border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
                <input required min={1} type="number" name="points_required" placeholder="Puntos requeridos" className={fieldClass} />
                <select name="status" defaultValue="active" className={fieldClass}>
                  <option value="active">activo</option>
                  <option value="inactive">inactivo</option>
                </select>
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton>Crear beneficio</PrimaryButton>
                  <Link href="/app/clientes?tab=beneficios" className="inline-flex h-11 items-center rounded-xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-800" prefetch={false}>
                    Cancelar
                  </Link>
                </div>
              </form>
            </ModuleCard>
          ) : (
            <Link href="/app/clientes?tab=beneficios&action=benefit" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800" prefetch={false}>
              <Plus size={16} />
              Nuevo beneficio
            </Link>
          )}

          <ModuleCard title="Lista de beneficios" description="Beneficios claros: descuento, postre, bebida o experiencia VIP.">
            {loyaltyData.rewards.length ? (
              <DataTable
                columns={["Beneficio", "Puntos", "Estado", "Descripcion"]}
                rows={loyaltyData.rewards.map((reward) => [
                  reward.name,
                  String(reward.points_required),
                  <StatusBadge key="status" status={reward.status} />,
                  reward.description ?? "-",
                ])}
              />
            ) : (
              <EmptyState title="Sin beneficios" description="Crea el primer beneficio para activar canjes." />
            )}
          </ModuleCard>

          <ModuleCard title="Ideas listas" description="Usa estas ideas como base para lanzar rapido.">
            <div className="grid gap-3 md:grid-cols-4">
              {benefitIdeas.map(([name, points]) => (
                <div key={name} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm font-semibold text-stone-950">{name}</p>
                  <p className="mt-2 text-sm text-stone-500">{points} puntos sugeridos</p>
                </div>
              ))}
            </div>
          </ModuleCard>
        </div>
      ) : null}

      {activeTab === "registro" ? (
        <div className="space-y-6">
          <section className="grid gap-4 xl:grid-cols-4">
            <ModuleCard title="QR para mesas" description="Imprime este QR para que tus clientes se registren solos.">
              <div className="flex flex-col items-center rounded-3xl border border-stone-200 bg-stone-50 p-6 text-center">
                <Image src={qrDataUrl} alt="QR de registro de clientes" width={220} height={220} unoptimized className="size-52 rounded-2xl bg-white p-4 shadow-sm" />
                <a href={qrDataUrl} download={`qr-${business.slug}.png`} className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-stone-950 px-3 text-xs font-medium text-white">
                  <Download size={14} />
                  Descargar QR
                </a>
              </div>
            </ModuleCard>

            <ModuleCard title="Link de registro" description="Comparte este enlace por WhatsApp, redes o correo.">
              <p className="break-all rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">{registerLink}</p>
              <div className="mt-4">
                <PublicLinkActions href={registerLink} />
              </div>
            </ModuleCard>

            <ModuleCard title="Registro manual" description="El equipo tambien puede crear clientes desde el panel.">
              <p className="text-sm leading-6 text-stone-600">
                Usa Nuevo cliente cuando una persona llama, reserva o llega sin escanear el QR.
              </p>
              <Link href="/app/clientes?action=new" className="mt-4 inline-flex h-10 items-center rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white" prefetch={false}>
                Nuevo cliente
              </Link>
            </ModuleCard>

            <ModuleCard title="Vista previa cliente" description="Asi entiende el cliente el flujo de registro.">
              <div className="rounded-[2rem] border border-stone-200 bg-stone-950 p-3 shadow-[0_24px_80px_rgba(28,25,23,0.16)]">
                <div className="rounded-[1.5rem] bg-white p-5">
                  <div className="h-24 rounded-2xl bg-stone-100" />
                  <p className="mt-5 text-lg font-semibold text-stone-950">Unete al club</p>
                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    Registra tu telefono, acumula puntos y recibe beneficios de {business.name}.
                  </p>
                  <div className="mt-5 grid gap-2">
                    <div className="h-10 rounded-xl bg-stone-100" />
                    <div className="h-10 rounded-xl bg-stone-100" />
                    <div className="h-11 rounded-xl bg-stone-950" />
                  </div>
                </div>
              </div>
            </ModuleCard>
          </section>
        </div>
      ) : null}
    </div>
  );
}

