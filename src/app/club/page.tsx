import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClubGatewayPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const query = await searchParams;

  if (query.slug) {
    redirect(`/club/${query.slug}`);
  }

  return (
    <main className="min-h-screen bg-stone-950 px-5 py-8 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
          Royalty Club
        </p>
        <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-normal md:text-7xl">
          Une clientes, puntos y beneficios en una experiencia simple.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-stone-300">
          Ingresa el codigo del restaurante para registrarte, ver tus puntos o abrir tu QR personal.
        </p>
        <form className="mt-10 grid max-w-xl gap-3 rounded-3xl border border-white/10 bg-white/10 p-3 backdrop-blur sm:grid-cols-[1fr_auto]">
          <input
            name="slug"
            placeholder="codigo-del-restaurante"
            className="h-12 rounded-2xl border border-white/10 bg-white px-4 text-sm font-semibold text-stone-950 outline-none placeholder:text-stone-400"
          />
          <button className="h-12 rounded-2xl bg-emerald-400 px-5 text-sm font-semibold text-stone-950 transition hover:bg-emerald-300">
            Abrir club
          </button>
        </form>
        <div className="mt-10 grid gap-3 text-sm text-stone-300 md:grid-cols-5">
          {["Me registro", "Acumulo puntos", "Veo beneficios", "Canjeo", "Regreso"].map((step, index) => (
            <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-stone-500">0{index + 1}</p>
              <p className="mt-2 font-semibold text-white">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
