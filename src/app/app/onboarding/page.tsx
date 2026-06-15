import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Gift,
  ImageIcon,
  QrCode,
  Sparkles,
  Star,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { updateOnboardingStepAction } from "@/app/app/actions";
import { getOnboardingChecklistData } from "@/lib/data";
import { ModuleCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

const stepMeta = [
  {
    title: "Logo del restaurante",
    description: "Carga una imagen para que la web, el club y los QR se sientan propios.",
    action: "Configurar",
    icon: ImageIcon,
  },
  {
    title: "Programa de puntos",
    description: "Define como tus clientes acumulan puntos por consumo.",
    action: "Configurar",
    icon: Star,
  },
  {
    title: "Primer beneficio",
    description: "Crea una recompensa clara para que el club tenga valor inmediato.",
    action: "Crear beneficio",
    icon: Gift,
  },
  {
    title: "Primer cliente",
    description: "Registra un cliente para probar perfiles, puntos e historial.",
    action: "Registrar cliente",
    icon: UserPlus,
  },
  {
    title: "QR de registro",
    description: "Genera el QR que puedes imprimir en mesas o recepcion.",
    action: "Generar QR",
    icon: QrCode,
  },
  {
    title: "Menu digital",
    description: "Sube el PDF del menu para compartirlo desde la web publica.",
    action: "Subir PDF",
    icon: Upload,
  },
  {
    title: "Equipo",
    description: "Agrega empleados para turnos, tareas y operacion diaria.",
    action: "Invitar empleados",
    icon: Users,
  },
  {
    title: "Primera reserva",
    description: "Crea una reserva para ver el flujo completo en el Centro Operativo.",
    action: "Crear reserva",
    icon: CalendarCheck,
  },
];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const onboarding = await getOnboardingChecklistData();
  const completed = onboarding.completed;
  const remaining = onboarding.total - completed;
  const ready = onboarding.progress === 100 || onboarding.current.business.onboarding_completed;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-950 text-white shadow-[0_24px_80px_rgba(28,25,23,0.14)]">
        <div className="grid gap-8 p-6 lg:grid-cols-[1fr_0.72fr] lg:p-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
              <Sparkles size={14} />
              Bienvenido a Royalty
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-normal md:text-5xl">
              Vamos a configurar tu restaurante en menos de 10 minutos.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-300">
              Completa estos pasos para que Royalty pueda ayudarte a gestionar clientes, fidelizar visitas,
              detectar oportunidades y controlar perdidas.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-4xl font-semibold">{onboarding.progress}%</p>
                <p className="mt-1 text-sm text-stone-300">configurado</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-4xl font-semibold">{completed}</p>
                <p className="mt-1 text-sm text-stone-300">pasos listos</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-4xl font-semibold">{remaining}</p>
                <p className="mt-1 text-sm text-stone-300">pendientes</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-4xl font-semibold">10</p>
                <p className="mt-1 text-sm text-stone-300">minutos</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-white p-5 text-stone-950">
            <p className="text-sm font-semibold">Modo demo visual</p>
            <div className="mt-4 rounded-3xl border border-stone-200 bg-stone-50 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-stone-950 text-sm font-semibold text-white">
                  RH
                </span>
                <div>
                  <p className="text-sm font-semibold">Restaurante demo configurado</p>
                  <p className="mt-1 text-xs text-stone-500">Web, club, reservas y QR listos.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-2">
                {["Club activo", "Menu digital", "Primer beneficio", "Centro Operativo"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-stone-700">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {params.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p> : null}
      {params.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{params.success}</p> : null}

      {ready ? (
        <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-3xl font-semibold text-emerald-950">🎉 Tu restaurante esta listo.</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-800">
            Royalty ya puede ayudarte a gestionar clientes, fidelizar visitas, detectar oportunidades y controlar perdidas.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/app/operacion" className="inline-flex h-11 items-center rounded-2xl bg-stone-950 px-5 text-sm font-semibold text-white">
              Ir al Centro Operativo
            </Link>
            {!onboarding.current.business.onboarding_completed ? (
              <form action={updateOnboardingStepAction}>
                <input type="hidden" name="onboarding_step" value={onboarding.total} />
                <input type="hidden" name="onboarding_completed" value="on" />
                <button className="inline-flex h-11 items-center rounded-2xl border border-emerald-300 bg-white px-5 text-sm font-semibold text-emerald-800">
                  Marcar como completo
                </button>
              </form>
            ) : null}
          </div>
        </section>
      ) : null}

      <ModuleCard title="Configura tu restaurante" description="Completa estos pasos para comenzar. Cada accion te lleva al lugar exacto.">
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-stone-950">{onboarding.progress}% completado</span>
            <span className="text-stone-500">{remaining} pasos pendientes</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-stone-950 transition-all" style={{ width: `${onboarding.progress}%` }} />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {onboarding.items.map((item, index) => {
            const meta = stepMeta[index];
            const Icon = meta.icon;

            return (
              <div key={item.label} className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-stone-50 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 gap-4">
                  <span className={["flex size-12 shrink-0 items-center justify-center rounded-2xl", item.done ? "bg-emerald-100 text-emerald-700" : "bg-white text-stone-600"].join(" ")}>
                    {item.done ? <CheckCircle2 size={21} /> : <Icon size={21} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-950">Paso {index + 1}: {meta.title}</p>
                    <p className="mt-1 text-sm leading-6 text-stone-500">{meta.description}</p>
                    <div className="mt-3">
                      <StatusBadge status={item.done ? "completed" : "pending"} />
                    </div>
                  </div>
                </div>
                <Link
                  href={item.href}
                  className={["inline-flex h-10 shrink-0 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition", item.done ? "border border-stone-200 bg-white text-stone-700 hover:bg-stone-100" : "bg-stone-950 text-white hover:bg-stone-800"].join(" ")}
                >
                  {item.done ? "Revisar" : meta.action}
                </Link>
              </div>
            );
          })}
        </div>
      </ModuleCard>
    </div>
  );
}
