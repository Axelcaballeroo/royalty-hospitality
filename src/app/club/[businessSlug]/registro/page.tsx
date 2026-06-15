import Link from "next/link";
import Image from "next/image";
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
    <main className="min-h-screen bg-stone-950 px-5 py-8 text-white">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Link href={`/club/${business.slug}`} className="text-sm font-semibold text-white/60 transition hover:text-white">
            Volver al club
          </Link>
          {business.logo_url ? (
            <Image
              src={business.logo_url}
              alt={`Logo de ${business.name}`}
              width={80}
              height={80}
              className="mt-8 size-20 rounded-3xl border border-white/15 bg-white object-contain p-3"
              unoptimized
            />
          ) : null}
          <h1 className="mt-8 text-5xl font-semibold tracking-normal">Registrate en el club.</h1>
          <p className="mt-5 max-w-md text-base leading-8 text-stone-300">
            Solo necesitamos tus datos basicos para crear tus puntos, tu codigo y tu QR personal.
          </p>
        </div>

        <form action={registerClubMemberAction} className="rounded-[2rem] border border-white/10 bg-white p-6 text-stone-950 shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
          <input type="hidden" name="business_slug" value={business.slug} />
          <input type="hidden" name="birthday" value="" />
          <p className="text-sm font-semibold text-stone-500">{business.name}</p>
          <h2 className="mt-3 text-3xl font-semibold">Unete a nuestro club de beneficios.</h2>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            Acumula puntos desde tu proxima visita y consulta tus beneficios cuando quieras.
          </p>
          {query.error ? (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formatEventType(decodeURIComponent(query.error))}
            </p>
          ) : null}
          <div className="mt-6 grid gap-3">
            <input required name="full_name" placeholder="Nombre" className="h-12 rounded-2xl border border-stone-200 px-4 text-sm outline-none focus:border-stone-400" />
            <input required name="phone" placeholder="Telefono" className="h-12 rounded-2xl border border-stone-200 px-4 text-sm outline-none focus:border-stone-400" />
            <input type="email" name="email" placeholder="Email opcional" className="h-12 rounded-2xl border border-stone-200 px-4 text-sm outline-none focus:border-stone-400" />
          </div>
          <button className="mt-5 h-12 w-full rounded-2xl text-sm font-semibold text-white transition" style={{ backgroundColor: primary }}>
            Crear mi cuenta
          </button>
          <p className="mt-4 text-center text-xs leading-5 text-stone-400">
            Al registrarte se crea tu cuenta de puntos y tu QR personal.
          </p>
        </form>
      </section>
    </main>
  );
}
