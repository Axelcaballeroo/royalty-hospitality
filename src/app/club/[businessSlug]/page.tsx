import Link from "next/link";
import { notFound } from "next/navigation";
import { registerClubMemberAction } from "@/app/club/actions";
import { getPublicBusinessBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ClubEnrollmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { businessSlug } = await params;
  const query = await searchParams;
  const data = await getPublicBusinessBySlug(businessSlug);

  if (!data?.business) {
    notFound();
  }

  const business = data.business;
  const primary = business.brand_primary_color || "#1c1917";

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg p-6 text-white shadow-sm" style={{ backgroundColor: primary }}>
          <Link href={`/site/${business.slug}`} className="text-sm font-medium text-white/70">
            Volver a {business.name}
          </Link>
          <h1 className="mt-8 text-4xl font-semibold leading-tight">
            Club de {business.name}
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/75">
            Registrate desde esta web responsive, recibe tu codigo personal y acumula puntos en tus visitas.
          </p>
          <Link
            href={`/club/${business.slug}/mi-cuenta`}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-white px-4 text-sm font-medium"
            style={{ color: primary }}
          >
            Ya tengo codigo
          </Link>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-stone-950">
            Inscripcion al club
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Telefono obligatorio. Email y cumpleanos son opcionales.
          </p>
          {query.error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {decodeURIComponent(query.error)}
            </p>
          ) : null}
          <form action={registerClubMemberAction} className="mt-6 grid gap-4">
            <input type="hidden" name="business_slug" value={business.slug} />
            <input required name="full_name" placeholder="Nombre completo" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input required name="phone" placeholder="Telefono" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input type="email" name="email" placeholder="Email opcional" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <input type="date" name="birthday" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
            <button className="h-11 rounded-lg text-sm font-medium text-white transition" style={{ backgroundColor: primary }}>
              Registrarme al club
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
