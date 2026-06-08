import Link from "next/link";
import { notFound } from "next/navigation";
import { clubAccountLoginAction } from "@/app/club/actions";
import { getPublicBusinessBySlug } from "@/lib/data";
import { formatEventType } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default async function ClubLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { businessSlug } = await params;
  const query = await searchParams;
  const publicData = await getPublicBusinessBySlug(businessSlug);

  if (!publicData?.business) {
    notFound();
  }

  const business = publicData.business;
  const primary = business.brand_primary_color || "#1c1917";

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5 py-8">
      <form action={clubAccountLoginAction} className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <input type="hidden" name="business_slug" value={business.slug} />
        <Link href={`/club/${business.slug}`} className="text-sm font-medium text-stone-500 hover:text-stone-950">
          Volver al club
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-stone-950">Ya soy miembro</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Ingresa con tu telefono y codigo de socio.
        </p>
        {query.error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formatEventType(decodeURIComponent(query.error))}
          </p>
        ) : null}
        <input required name="phone" placeholder="Telefono" className="mt-6 h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none focus:border-stone-400" />
        <input required name="code" placeholder="Codigo de socio" className="mt-3 h-11 w-full rounded-lg border border-stone-200 px-3 text-sm uppercase outline-none focus:border-stone-400" />
        <button className="mt-5 h-11 w-full rounded-lg text-sm font-medium text-white" style={{ backgroundColor: primary }}>
          Ver mi cuenta
        </button>
      </form>
    </main>
  );
}
