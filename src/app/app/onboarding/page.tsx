import Link from "next/link";
import { updateOnboardingStepAction } from "@/app/app/actions";
import { getCurrentBusiness } from "@/lib/current-business";
import { ModuleCard, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

const steps = [
  "Datos del negocio",
  "Horarios",
  "Branding basico",
  "Crear primer cliente",
  "Crear primera reserva",
  "Activar modulos iniciales",
];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const current = await getCurrentBusiness();
  const params = await searchParams;
  const currentStep = current.business.onboarding_step ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">Onboarding</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">
          Configuracion inicial
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Avanza los pasos basicos para dejar listo el negocio antes de operar.
        </p>
      </div>
      {params.error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{params.error}</p> : null}
      {params.success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{params.success}</p> : null}

      <ModuleCard title="Pasos" description="Flujo V1 manual y guiado.">
        <div className="grid gap-3 md:grid-cols-2">
          {steps.map((step, index) => {
            const number = index + 1;
            const done = number < currentStep || current.business.onboarding_completed;
            return (
              <div key={step} className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-stone-950">{number}. {step}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {number === 4 ? "Ir a clientes" : number === 5 ? "Ir a reservas" : "Completar en configuracion"}
                  </p>
                </div>
                <StatusBadge status={done ? "completed" : number === currentStep ? "active" : "pending"} />
              </div>
            );
          })}
        </div>
      </ModuleCard>

      <ModuleCard title="Actualizar avance" description="Marca el paso actual o completa onboarding.">
        <form action={updateOnboardingStepAction} className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <select name="onboarding_step" defaultValue={currentStep} className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-stone-400">
            {steps.map((step, index) => (
              <option key={step} value={index + 1}>
                Paso {index + 1}: {step}
              </option>
            ))}
          </select>
          <label className="flex h-11 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm font-medium text-stone-700">
            <input name="onboarding_completed" type="checkbox" defaultChecked={current.business.onboarding_completed ?? false} />
            Completo
          </label>
          <button className="h-11 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white">
            Guardar avance
          </button>
        </form>
      </ModuleCard>

      <div className="flex flex-wrap gap-3">
        <Link href="/app/configuracion" className="rounded-lg bg-stone-950 px-4 py-3 text-sm font-medium text-white">Configurar negocio</Link>
        <Link href="/app/clientes" className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-800">Crear cliente</Link>
        <Link href="/app/reservas" className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-800">Crear reserva</Link>
      </div>
    </div>
  );
}
