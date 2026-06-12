import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { ModuleCard, SectionHeader } from "@/components/ui";
import { canSeeAdminGuidance } from "@/lib/navigation";
import { requireCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

const demoSteps = [
  {
    step: "PASO 1",
    title: "Registrar cliente",
    href: "/app/clientes",
    linkLabel: "Clientes",
    description: "Crea o registra un cliente para comenzar a construir su historial.",
  },
  {
    step: "PASO 2",
    title: "Cliente se une al club",
    href: (slug: string) => `/club/${slug}`,
    linkLabel: "Club de clientes",
    description: "El cliente obtiene puntos, recompensas y beneficios.",
  },
  {
    step: "PASO 3",
    title: "Registrar consumo",
    href: "/app/checkin",
    linkLabel: "Check-in",
    description: "Busca al cliente y registra su consumo para sumar puntos.",
  },
  {
    step: "PASO 4",
    title: "Fidelizacion",
    href: "/app/fidelizacion",
    linkLabel: "Fidelizacion",
    description: "Visualiza niveles, puntos y recompensas.",
  },
  {
    step: "PASO 5",
    title: "Marketing",
    href: "/app/marketing",
    linkLabel: "Marketing",
    description: "Envia promociones a clientes VIP, inactivos o frecuentes.",
  },
  {
    step: "PASO 6",
    title: "Inventario y merma",
    href: "/app/inventario",
    linkLabel: "Inventario",
    description: "Controla productos y evita perdidas.",
  },
  {
    step: "PASO 7",
    title: "RRHH",
    href: "/app/rrhh",
    linkLabel: "RRHH",
    description: "Gestiona empleados, turnos y asistencia.",
  },
  {
    step: "PASO 8",
    title: "Reportes",
    href: "/app/reportes",
    linkLabel: "Reportes",
    description: "Analiza el rendimiento completo del negocio.",
  },
];

export default async function DemoPage() {
  const current = await requireCurrentBusiness();

  if (!canSeeAdminGuidance(current.role)) {
    redirect("/app/dashboard");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
              <Sparkles size={14} />
              Recorrido guiado
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-stone-950">
              Bienvenido a Royalty Hospitality OS
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Este sistema te ayuda a conseguir mas clientes, hacer que vuelvan, controlar tu operacion y vender mas.
            </p>
          </div>
          <Link
            href="/app/ayuda"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 transition hover:border-stone-300"
          >
            Abrir centro de ayuda
          </Link>
        </div>
      </section>

      <SectionHeader
        title="Demo flow"
        description="Sigue estos pasos para explicar el valor del sistema en una demo comercial o capacitacion interna."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {demoSteps.map((item) => {
          const href = typeof item.href === "function" ? item.href(current.business.slug) : item.href;

          return (
            <ModuleCard key={item.step} title={item.title} description={item.description}>
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  {item.step}
                </p>
                <Link
                  href={href}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-950 px-3 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  Ir a {item.linkLabel}
                  <ArrowRight size={15} />
                </Link>
              </div>
            </ModuleCard>
          );
        })}
      </section>
    </div>
  );
}
