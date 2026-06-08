import Link from "next/link";
import { notFound } from "next/navigation";
import { registerClubMemberAction } from "@/app/club/actions";
import { getPublicBusinessBySlug } from "@/lib/data";
import { formatEventType } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default async function ClubRegisterPage({
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
      <section className="mx-auto max-w-xl rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <Link href={`/club/${business.slug}`} className="text-sm font-medium text-stone-500 hover:text-stone-950">
          Volver al club
        </Link>
        <h1 className="mt-6 text-3xl font-semibold text-stone-950">Registrarme</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Telefono obligatorio. Email y cumpleanos son opcionales.
        </p>
        {query.error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formatEventType(decodeURIComponent(query.error))}
          </p>
        ) : null}
        <form action={registerClubMemberAction} className="mt-6 grid gap-4">
          <input type="hidden" name="business_slug" value={business.slug} />
          <input required name="full_name" placeholder="Nombre completo" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
          <input required name="phone" placeholder="Telefono" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
          <input type="email" name="email" placeholder="Email opcional" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
          <input type="date" name="birthday" className="h-11 rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
          <button className="h-11 rounded-lg text-sm font-medium text-white transition" style={{ backgroundColor: primary }}>
            Crear mi cuenta
          </button>
        </form>
      </section>
    </main>
  );
}
