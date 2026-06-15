import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import {
  sendCampaignAction,
  updateCampaignRecipientStatusAction,
} from "@/app/app/actions";
import { getCampaignDetail } from "@/lib/data";
import { DataTable, EmptyState, ModuleCard, StatCard, StatusBadge } from "@/components/ui";
import { UpgradeModuleScreen } from "@/components/upgrade-module-screen";
import { hasModule } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ error?: string; success?: string; send?: string }>;
}) {
  const { campaignId } = await params;
  const query = await searchParams;
  if (!(await hasModule("marketing"))) {
    return <UpgradeModuleScreen moduleKey="marketing" />;
  }

  const { campaign, recipients, metrics } = await getCampaignDetail(campaignId);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Link href="/app/marketing" className="text-sm font-medium text-stone-500 hover:text-stone-950" prefetch={false}>
            Volver a marketing
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-stone-950">
            {campaign.name}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            {campaign.type} / {campaign.segment_key} / {campaign.channel}
          </p>
        </div>
        {campaign.status !== "sent" ? (
          <form action={sendCampaignAction}>
            <input type="hidden" name="campaign_id" value={campaign.id} />
            <ConfirmSubmitButton
              message="Enviar campana simulada a todos los clientes del segmento?"
              className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Enviar campana simulada
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>

      {query.send ? (
        <form action={sendCampaignAction}>
          <input type="hidden" name="campaign_id" value={campaign.id} />
          <ConfirmSubmitButton
            message="Confirmar envio simulado de esta campana?"
            className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Confirmar envio pendiente
          </ConfirmSubmitButton>
        </form>
      ) : null}
      {query.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{query.error}</p> : null}
      {query.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{query.success}</p> : null}

      <section className="grid gap-4 md:grid-cols-5">
        <StatCard title="Destinatarios" value={String(metrics.total)} detail="Total recipients" tone="dark" />
        <StatCard title="Enviados" value={String(metrics.sent)} detail="status sent" />
        <StatCard title="Abiertos" value={String(metrics.opened)} detail="manual" />
        <StatCard title="Clicks" value={String(metrics.clicked)} detail="manual" />
        <StatCard title="Canjeados" value={String(metrics.redeemed)} detail="manual" />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <ModuleCard title="Mensaje" description="Preview bruto de campana.">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700">
            {campaign.message}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge status={campaign.status} />
            <StatusBadge status={campaign.channel} />
          </div>
        </ModuleCard>

        <ModuleCard title="Destinatarios" description="Reportes manuales hasta integrar canales reales.">
          {recipients.length ? (
            <DataTable
              columns={["Cliente", "Contacto", "Estado", "Acciones"]}
              rows={recipients.map((recipient) => [
                recipient.customers?.full_name ?? "Cliente",
                recipient.customers?.phone ?? recipient.customers?.email ?? "-",
                <StatusBadge key="status" status={recipient.status} />,
                <div key="actions" className="flex flex-wrap gap-2">
                  {["opened", "clicked", "redeemed"].map((status) => (
                    <form key={status} action={updateCampaignRecipientStatusAction}>
                      <input type="hidden" name="campaign_id" value={campaign.id} />
                      <input type="hidden" name="recipient_id" value={recipient.id} />
                      <input type="hidden" name="status" value={status} />
                      <button className="rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-600 hover:bg-stone-50">
                        {status}
                      </button>
                    </form>
                  ))}
                </div>,
              ])}
            />
          ) : (
            <EmptyState title="Sin destinatarios" description="Envia la campana simulada para crear recipients." />
          )}
        </ModuleCard>
      </section>
    </div>
  );
}
