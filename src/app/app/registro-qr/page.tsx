import { headers } from "next/headers";
import Image from "next/image";
import { Download } from "lucide-react";
import { PublicLinkActions } from "@/components/public-link-actions";
import { ModuleCard, SectionHeader } from "@/components/ui";
import { getBusinessSettingsData } from "@/lib/data";
import { createQrDataUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

export default async function CustomerQrPage() {
  const { current } = await getBusinessSettingsData();
  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const origin = host ? `${protocol}://${host}` : "";
  const registerLink = `${origin}/club/${current.business.slug}/registro`;
  const qrDataUrl = await createQrDataUrl(registerLink);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Clientes"
        title="Registro QR"
        description="Imprime este QR para que tus clientes se registren solos."
      />

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <ModuleCard title="QR de registro" description="Colocalo en mesas, cuenta, recepcion o material impreso.">
          <div className="flex flex-col items-center rounded-3xl border border-stone-200 bg-stone-50 p-8 text-center">
            <Image
              src={qrDataUrl}
              alt="QR de registro de clientes"
              width={256}
              height={256}
              unoptimized
              className="size-64 rounded-2xl bg-white p-4 shadow-sm"
            />
            <p className="mt-5 text-sm font-semibold text-stone-950">{current.business.name}</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
              El cliente entra, deja sus datos y queda listo para acumular puntos.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <a
                href={qrDataUrl}
                download={`qr-${current.business.slug}.png`}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-stone-950 px-3 text-xs font-medium text-white transition hover:bg-stone-800"
              >
                <Download size={14} />
                Descargar QR
              </a>
              <PublicLinkActions href={registerLink} />
            </div>
          </div>
        </ModuleCard>

        <ModuleCard title="Vista previa movil" description="Asi entiende el flujo el cliente antes de registrarse.">
          <div className="mx-auto max-w-xs rounded-[2rem] border border-stone-200 bg-stone-950 p-3 shadow-[0_24px_80px_rgba(28,25,23,0.16)]">
            <div className="rounded-[1.5rem] bg-white p-5">
              <div className="h-28 rounded-2xl bg-stone-100" />
              <p className="mt-5 text-lg font-semibold text-stone-950">Unete al club</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Registra tu telefono, acumula puntos y recibe beneficios de {current.business.name}.
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
  );
}
