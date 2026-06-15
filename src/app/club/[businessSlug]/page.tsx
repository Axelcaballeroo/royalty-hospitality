import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Gift, QrCode, Sparkles, Star } from "lucide-react";
import { getPublicBusinessBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

const featureCards = [
  { title: "Tus puntos", description: "Consulta lo acumulado despues de cada visita.", Icon: Sparkles },
  { title: "Tus beneficios", description: "Ve que puedes canjear y que te falta.", Icon: Gift },
  { title: "Tu QR", description: "Muestralo al llegar para sumar puntos.", Icon: QrCode },
];

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
  const secondary = business.brand_secondary_color || "#10b981";

  return (
    <main className="min-h-screen bg-stone-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <section className="grid min-h-[calc(100vh-4rem)] gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Link href={`/site/${business.slug}`} className="text-sm font-semibold text-white/60 transition hover:text-white">
              {business.name}
            </Link>
            {business.logo_url ? (
              <Image
                src={business.logo_url}
                alt={`Logo de ${business.name}`}
                width={96}
                height={96}
                className="mt-8 size-24 rounded-3xl border border-white/15 bg-white object-contain p-3"
                unoptimized
              />
            ) : null}
            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: secondary }}>
              Club de beneficios
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-normal md:text-7xl">
              Unete a nuestro club de beneficios.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300">
              Registrate una vez, muestra tu QR cuando nos visites, acumula puntos y canjea beneficios en tu siguiente visita.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/club/${business.slug}/registro`}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold"
                style={{ color: primary }}
              >
                Registrarme
              </Link>
              <Link
                href={`/club/${business.slug}/login`}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ya soy miembro
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.28)] backdrop-blur">
            <div className="rounded-[1.5rem] bg-white p-5 text-stone-950">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">Mi Club</p>
                  <p className="mt-1 text-xl font-semibold">{business.name}</p>
                </div>
                <span className="flex size-12 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: primary }}>
                  <Star size={20} />
                </span>
              </div>
              <div className="mt-8 rounded-3xl p-5 text-white" style={{ backgroundColor: primary }}>
                <p className="text-sm text-white/70">Tus puntos</p>
                <p className="mt-2 text-5xl font-semibold">0</p>
                <p className="mt-4 text-sm text-white/70">Empieza en Bronce y sube de nivel con cada consumo.</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-stone-100 p-4">
                  <QrCode size={22} />
                  <p className="mt-3 text-sm font-semibold">QR personal</p>
                </div>
                <div className="rounded-2xl bg-stone-100 p-4">
                  <Gift size={22} />
                  <p className="mt-3 text-sm font-semibold">Beneficios</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 pb-12 md:grid-cols-5">
          {[
            ["1", "Me registro", "Nombre, telefono y email opcional."],
            ["2", "Reservo o visito", "Tu perfil queda conectado al restaurante."],
            ["3", "Muestro mi QR", "El staff te identifica rapido."],
            ["4", "Acumulo puntos", "Cada consumo suma a tu nivel."],
            ["5", "Canjeo y regreso", "Tus beneficios te esperan."],
          ].map(([number, title, description]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <span className="flex size-9 items-center justify-center rounded-2xl text-sm font-semibold text-stone-950" style={{ backgroundColor: secondary }}>
                {number}
              </span>
              <p className="mt-4 text-sm font-semibold text-white">{title}</p>
              <p className="mt-2 text-sm leading-6 text-stone-400">{description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 pb-12 md:grid-cols-3">
          {featureCards.map(({ title, description, Icon }) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white p-6 text-stone-950">
              <Icon className="text-stone-500" size={24} />
              <p className="mt-5 text-lg font-semibold">{title}</p>
              <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
