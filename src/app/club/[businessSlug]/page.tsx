import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicBusinessBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ClubEnrollmentPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const data = await getPublicBusinessBySlug(businessSlug);

  if (!data?.business) {
    notFound();
  }

  const business = data.business;
  const primary = business.brand_primary_color || "#1c1917";

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-lg p-6 text-white shadow-sm md:p-10" style={{ backgroundColor: primary }}>
          <Link href={`/site/${business.slug}`} className="text-sm font-medium text-white/70">
            Volver a {business.name}
          </Link>
          <h1 className="mt-10 text-4xl font-semibold leading-tight md:text-5xl">
            Club de {business.name}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75">
            Acumula puntos, consulta recompensas, revisa tu wallet y muestra tu QR personal en cada visita.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/club/${business.slug}/registro`}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-4 text-sm font-medium"
              style={{ color: primary }}
            >
              Registrarme
            </Link>
            <Link
              href={`/club/${business.slug}/login`}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/30 px-4 text-sm font-medium text-white"
            >
              Ya soy miembro
            </Link>
          </div>
        </section>

        <section className="grid gap-4 py-6 md:grid-cols-3">
          {["Puntos por visita", "Recompensas activas", "QR y wallet personal"].map((benefit) => (
            <div key={benefit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-stone-950">{benefit}</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">Beneficio disponible para miembros del club.</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
