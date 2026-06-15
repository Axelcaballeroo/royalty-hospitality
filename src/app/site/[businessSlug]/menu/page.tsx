import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { getPublicBusinessBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const data = await getPublicBusinessBySlug(businessSlug);

  if (!data?.business || !data.business.website_enabled) {
    notFound();
  }

  const business = data.business;
  const primary = business.brand_primary_color || "#1c1917";

  return (
    <main className="min-h-screen bg-stone-950 px-5 py-8 text-white">
      <section className="mx-auto max-w-5xl">
        <Link href={`/site/${business.slug}`} className="text-sm font-semibold text-white/60 transition hover:text-white">
          Volver a {business.name}
        </Link>
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white p-5 text-stone-950 shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Menu digital</p>
              <h1 className="mt-3 text-4xl font-semibold">{business.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
                Consulta el menu antes de reservar o llegar al restaurante.
              </p>
            </div>
            <Link
              href={`/site/${business.slug}/reservas`}
              className="inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white"
              style={{ backgroundColor: primary }}
            >
              Reservar mesa
            </Link>
          </div>

          {business.menu_pdf_url ? (
            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-100">
              <iframe
                title={`Menu de ${business.name}`}
                src={business.menu_pdf_url}
                className="h-[78vh] w-full"
              />
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
              <FileText className="mx-auto text-stone-400" size={36} />
              <h2 className="mt-4 text-2xl font-semibold text-stone-950">Menu por confirmar</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
                El restaurante aun no cargo su PDF. Puedes reservar y consultar disponibilidad directamente.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
