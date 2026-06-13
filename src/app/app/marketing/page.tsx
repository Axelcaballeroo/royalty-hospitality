import Link from "next/link";
import { Send } from "lucide-react";
import {
  createCampaignAction,
  createMessageTemplateAction,
} from "@/app/app/actions";
import { getMarketingData } from "@/lib/data";
import { renderMarketingMessage, segmentDefinitions, suggestedTemplates } from "@/lib/marketing";
import { DataTable, EmptyState, ModuleCard, StatCard, StatusBadge } from "@/components/ui";
import { UpgradeModuleScreen } from "@/components/upgrade-module-screen";
import { hasModule } from "@/lib/plans";
import { formatEventType, formatStatus } from "@/lib/formatters";

export const dynamic = "force-dynamic";

const campaignTypes = [
  "promotion",
  "birthday",
  "inactive_customers",
  "vip",
  "reward",
  "waste_reduction",
  "event",
];
const channels = ["manual", "whatsapp", "email", "sms", "push"];
const marketingPlays = [
  {
    title: "Recuperar clientes inactivos",
    description: "Invita a volver a quienes no visitan hace 60 dias.",
    type: "inactive_customers",
    segment: "inactive_60d",
    message: "Hola {{nombre}}, te extranamos en {{negocio}}. Vuelve esta semana y recibe un beneficio especial.",
  },
  {
    title: "Promocionar producto por vencer",
    description: "Convierte riesgo de merma en visita hoy.",
    type: "waste_reduction",
    segment: "customers_with_points",
    message: "Hoy tenemos una promocion especial en productos seleccionados. Reserva o visitanos antes de que termine el dia.",
  },
  {
    title: "Cumpleanos del mes",
    description: "Activa un beneficio para clientes que cumplen este mes.",
    type: "birthday",
    segment: "birthday_month",
    message: "Hola {{nombre}}, en {{negocio}} queremos celebrar contigo. Este mes tienes un beneficio especial.",
  },
  {
    title: "Clientes VIP",
    description: "Comunica experiencias especiales a clientes frecuentes.",
    type: "vip",
    segment: "vip_customers",
    message: "Hola {{nombre}}, tenemos una experiencia especial para clientes VIP en {{negocio}}.",
  },
  {
    title: "Clientes con puntos disponibles",
    description: "Recuerda a clientes con saldo que pueden volver a usarlo.",
    type: "reward",
    segment: "customers_with_points",
    message: "Hola {{nombre}}, tienes {{puntos}} puntos disponibles. Puedes usarlos en tu proxima visita.",
  },
];

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    segment?: string;
    type?: string;
    name?: string;
    message?: string;
  }>;
}) {
  const params = await searchParams;
  if (!(await hasModule("marketing"))) {
    return <UpgradeModuleScreen moduleKey="marketing" />;
  }

  const selectedSegment = params.segment ?? "all_customers";
  const defaultCampaignType = campaignTypes.includes(params.type ?? "")
    ? params.type ?? "promotion"
    : "promotion";
  const { current, campaigns, templates, segmentCustomers, segmentSummaries, metrics } =
    await getMarketingData(selectedSegment);
  const previewCustomer = segmentCustomers[0];
  const previewMessage = previewCustomer
    ? renderMarketingMessage({
        message:
          templates[0]?.message ??
          "Hola {{nombre}}, tienes {{puntos}} puntos disponibles en {{negocio}}.",
        customer: previewCustomer,
        businessName: current.business.name,
      })
    : "Selecciona un segmento con clientes para ver preview.";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
          Acciones comerciales
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">
          Acciones comerciales
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Convierte datos del restaurante en acciones simples para recuperar clientes, activar VIP y reducir merma.
        </p>
      </div>

      {params.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formatEventType(params.error)}</p> : null}
      {params.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{formatEventType(params.success)}</p> : null}

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Acciones creadas" value={String(metrics.campaignsCreated)} detail="Recientes" tone="dark" />
        <StatCard title="Enviadas" value={String(metrics.campaignsSent)} detail="Comunicaciones" />
        <StatCard title="Clientes alcanzados" value={String(metrics.customersReached)} detail="Contactos" />
        <StatCard title="Inactivos" value={String(metrics.inactiveCustomers)} detail="60 dias" />
        <StatCard title="Cumpleanos" value={String(metrics.birthdayCustomers)} detail="Este mes" />
        <StatCard title="Clientes VIP" value={String(metrics.vipCustomers)} detail="Visitas o gasto" />
      </section>

      <ModuleCard title="Oportunidades comerciales" description="El sistema traduce clientes e inventario en acciones listas para revisar.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-sm font-semibold text-stone-950">{metrics.inactiveCustomers} clientes pueden recuperarse</p>
            <p className="mt-2 text-sm leading-6 text-stone-700">Crea una campana para quienes no visitan hace mas de 60 dias.</p>
            <Link href="/app/marketing?segment=inactive_60d&type=inactive_customers" className="mt-4 inline-flex h-10 items-center rounded-xl bg-white px-3 text-sm font-semibold text-stone-800">
              Crear campana
            </Link>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-sm font-semibold text-stone-950">{metrics.birthdayCustomers} cumpleanos del mes</p>
            <p className="mt-2 text-sm leading-6 text-stone-700">Invita a celebrar y aumenta visitas con un beneficio simple.</p>
            <Link href="/app/marketing?segment=birthday_month&type=birthday" className="mt-4 inline-flex h-10 items-center rounded-xl bg-white px-3 text-sm font-semibold text-stone-800">
              Crear campana
            </Link>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-stone-950">{metrics.vipCustomers} clientes VIP</p>
            <p className="mt-2 text-sm leading-6 text-stone-700">Comunica experiencias especiales a clientes frecuentes.</p>
            <Link href="/app/marketing?segment=vip_customers&type=vip" className="mt-4 inline-flex h-10 items-center rounded-xl bg-white px-3 text-sm font-semibold text-stone-800">
              Crear campana
            </Link>
          </div>
        </div>
      </ModuleCard>

      <ModuleCard title="Acciones de marketing" description="Elige el objetivo de negocio y crea una campana lista para editar.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {marketingPlays.map((play) => (
            <div key={play.title} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-stone-950">{play.title}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{play.description}</p>
              <Link
                href={`/app/marketing?type=${play.type}&segment=${play.segment}&name=${encodeURIComponent(play.title)}&message=${encodeURIComponent(play.message)}`}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-stone-950 px-3 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                Crear campana
              </Link>
            </div>
          ))}
        </div>
      </ModuleCard>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ModuleCard title="Crear campana" description="Prepara una accion comercial lista para revisar y enviar.">
          <form action={createCampaignAction} className="grid gap-3">
            <input required name="name" defaultValue={params.name ?? ""} placeholder="Nombre de campana" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <div className="grid gap-3 sm:grid-cols-3">
              <select required name="type" defaultValue={defaultCampaignType} className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
                {campaignTypes.map((type) => <option key={type} value={type}>{formatEventType(type)}</option>)}
              </select>
              <select required name="segment_key" defaultValue={selectedSegment} className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
                {segmentDefinitions.map((segment) => <option key={segment.key} value={segment.key}>{segment.name}</option>)}
              </select>
              <select name="channel" defaultValue="manual" className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
                {channels.map((channel) => <option key={channel} value={channel}>{formatStatus(channel)}</option>)}
              </select>
            </div>
            <textarea required name="message" defaultValue={params.message ?? ""} placeholder="Mensaje con variables: {{nombre}}, {{negocio}}, {{puntos}}, {{nivel}}" className="min-h-28 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <input type="datetime-local" name="scheduled_at" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <div className="grid gap-3 sm:grid-cols-3">
              <button name="campaign_action" value="draft" className="h-11 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-800 transition hover:border-stone-300">
                Guardar borrador
              </button>
              <button name="campaign_action" value="schedule" className="h-11 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-800 transition hover:border-stone-300">
                Programar
              </button>
              <button name="campaign_action" value="send" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
                <Send size={16} />
                Enviar simulada
              </button>
            </div>
          </form>
        </ModuleCard>

        <ModuleCard title="Segmento seleccionado" description="Cantidad estimada y preview de clientes.">
          <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <select name="segment" defaultValue={selectedSegment} className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
              {segmentDefinitions.map((segment) => <option key={segment.key} value={segment.key}>{segment.name}</option>)}
            </select>
            <button className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white">Ver segmento</button>
          </form>
          <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm font-semibold text-stone-950">{segmentCustomers.length} clientes estimados</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">{previewMessage}</p>
          </div>
          <div className="mt-4 grid gap-2">
            {segmentCustomers.slice(0, 5).map((customer) => (
              <div key={customer.id} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                {customer.full_name} / {customer.phone ?? customer.email ?? "sin contacto"}
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ModuleCard title="Campanas recientes" description="Acciones comerciales creadas para este negocio.">
          {campaigns.length ? (
            <DataTable
              columns={["Nombre", "Segmento", "Canal", "Estado", "Detalle"]}
              rows={campaigns.map((campaign) => [
                campaign.name,
                segmentDefinitions.find((segment) => segment.key === campaign.segment_key)?.name ?? campaign.segment_key,
                formatStatus(campaign.channel),
                <StatusBadge key="status" status={campaign.status} />,
                <Link key="detail" href={`/app/marketing/${campaign.id}`} className="font-medium text-stone-950 hover:underline">Abrir</Link>,
              ])}
            />
          ) : (
            <EmptyState title="Sin campanas" description="Crea la primera campana para comenzar a medir recipients." />
          )}
        </ModuleCard>

        <ModuleCard title="Segmentos disponibles" description="Conteo actual por segmento automatico.">
          <div className="grid gap-2">
            {segmentSummaries.map((segment) => (
              <div key={segment.key} className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                <span className="text-sm font-medium text-stone-700">{segment.name}</span>
                <span className="text-sm font-semibold text-stone-950">{segment.count}</span>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ModuleCard title="Crear plantilla" description="Plantillas reutilizables para futuras integraciones.">
          <form action={createMessageTemplateAction} className="grid gap-3">
            <input required name="name" placeholder="Nombre de plantilla" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <select name="type" defaultValue="promotion" className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
              {campaignTypes.map((type) => <option key={type} value={type}>{formatEventType(type)}</option>)}
            </select>
            <textarea required name="message" placeholder="Mensaje" className="min-h-24 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-400" />
            <button className="h-11 rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Crear plantilla
            </button>
          </form>
        </ModuleCard>
        <ModuleCard title="Plantillas" description="Creadas y sugeridas para arranque.">
          <div className="grid gap-3">
            {[...templates, ...suggestedTemplates].slice(0, 8).map((template, index) => (
              <div key={`${template.name}-${index}`} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                <p className="text-sm font-semibold text-stone-950">{template.name}</p>
                <p className="mt-1 text-xs text-stone-500">{formatEventType(template.type)}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">{template.message}</p>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>
    </div>
  );
}
