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
          Marketing
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">
          Marketing Engine V1
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Segmentos, plantillas y campanas simuladas. WhatsApp, email, SMS y push quedan preparados para futuras integraciones.
        </p>
      </div>

      {params.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p> : null}
      {params.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{params.success}</p> : null}

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Campanas creadas" value={String(metrics.campaignsCreated)} detail="Recientes" tone="dark" />
        <StatCard title="Campanas enviadas" value={String(metrics.campaignsSent)} detail="Simuladas" />
        <StatCard title="Clientes alcanzados" value={String(metrics.customersReached)} detail="Recipients" />
        <StatCard title="Inactivos" value={String(metrics.inactiveCustomers)} detail="60 dias" />
        <StatCard title="Cumpleanos" value={String(metrics.birthdayCustomers)} detail="Este mes" />
        <StatCard title="Clientes VIP" value={String(metrics.vipCustomers)} detail="Visitas o gasto" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ModuleCard title="Crear campana" description="Guarda borrador, agenda o envia una campana simulada.">
          <form action={createCampaignAction} className="grid gap-3">
            <input required name="name" defaultValue={params.name ?? ""} placeholder="Nombre de campana" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <div className="grid gap-3 sm:grid-cols-3">
              <select required name="type" defaultValue={defaultCampaignType} className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
                {campaignTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <select required name="segment_key" defaultValue={selectedSegment} className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
                {segmentDefinitions.map((segment) => <option key={segment.key} value={segment.key}>{segment.name}</option>)}
              </select>
              <select name="channel" defaultValue="manual" className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
                {channels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
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
        <ModuleCard title="Campanas recientes" description="Detalle y reportes manuales disponibles.">
          {campaigns.length ? (
            <DataTable
              columns={["Nombre", "Segmento", "Canal", "Estado", "Detalle"]}
              rows={campaigns.map((campaign) => [
                campaign.name,
                campaign.segment_key,
                campaign.channel,
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
              {campaignTypes.map((type) => <option key={type} value={type}>{type}</option>)}
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
                <p className="mt-1 text-xs text-stone-500">{template.type}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">{template.message}</p>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>
    </div>
  );
}
