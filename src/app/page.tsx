import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  ContactRound,
  Gift,
  Megaphone,
  Package,
  WalletCards,
} from "lucide-react";
import { moduleHighlights } from "@/lib/navigation";

const modules = [
  { title: "Reservas", text: "Disponibilidad, estados y cliente asociado.", icon: CalendarCheck },
  { title: "Clientes CRM", text: "Perfil, historial, notas, tareas y comentarios.", icon: ContactRound },
  { title: "Marketing", text: "Segmentos y campanas sobre comportamiento real.", icon: Megaphone },
  { title: "Fidelizacion", text: "Puntos, niveles y beneficios preparados.", icon: Gift },
  { title: "Wallet", text: "Saldo y recargas futuras sin pagos reales aun.", icon: WalletCards },
  { title: "Inventario", text: "Productos, existencia, vigencias y merma futura.", icon: Package },
];

const futurePlans = [
  "Pagos y wallet real",
  "WhatsApp transaccional",
  "Push notifications",
  "Geolocalizacion",
  "Inventario avanzado",
  "Nomina y app movil",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-stone-950 text-white">
            <Building2 size={18} />
          </span>
          <span className="text-sm font-semibold text-stone-950">
            Royalty Hospitality OS
          </span>
        </Link>
        <Link
          href="/app/dashboard"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          Entrar
          <ArrowRight size={16} />
        </Link>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-14 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-20">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-700">
            Plataforma modular multi-tenant
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-stone-950 md:text-6xl">
            Royalty Hospitality OS
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            Sistema operativo SaaS para restaurantes, bares, beach clubs,
            antros, cafeterias y grupos gastronomicos. No gira alrededor de una
            reserva: gira alrededor del cliente y todo su historial.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/app/dashboard"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Ver app privada
              <ArrowRight size={17} />
            </Link>
            <a
              href="#modulos"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-stone-300 bg-white px-5 text-sm font-medium text-stone-800 transition hover:border-stone-400"
            >
              Ver modulos
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="rounded-lg bg-stone-950 p-6 text-white">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
              Vista operacional
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div>
                <p className="text-4xl font-semibold">128</p>
                <p className="mt-1 text-sm text-stone-300">reservas de hoy</p>
              </div>
              <div>
                <p className="text-4xl font-semibold">76%</p>
                <p className="mt-1 text-sm text-stone-300">
                  clientes recurrentes
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {moduleHighlights.slice(0, 4).map((item) => (
              <div
                key={item}
                className="rounded-lg border border-stone-200 bg-stone-50 p-4"
              >
                <p className="text-sm font-semibold leading-6 text-stone-800">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="modulos" className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
              Modulos principales
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-stone-950">
              Una plataforma, muchos negocios, datos aislados por business_id.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <div
                  key={module.title}
                  className="rounded-lg border border-stone-200 bg-stone-50 p-5"
                >
                  <Icon className="text-emerald-700" size={22} />
                  <p className="mt-5 text-base font-semibold text-stone-950">
                    {module.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    {module.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-stone-200 bg-stone-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[0.8fr_1fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
              Planes futuros
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-stone-950">
              Preparado para crecer sin activar complejidad antes de tiempo.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {futurePlans.map((plan) => (
              <div
                key={plan}
                className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700"
              >
                {plan}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-950 px-6 py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Etapa 1 lista
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              Entra al dashboard y revisa el core operativo.
            </h2>
          </div>
          <Link
            href="/app/dashboard"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-medium text-stone-950 transition hover:bg-stone-100"
          >
            Abrir SaaS
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
