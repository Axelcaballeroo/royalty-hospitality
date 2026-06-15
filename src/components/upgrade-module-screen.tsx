import Link from "next/link";
import { LockKeyhole, Sparkles } from "lucide-react";
import { moduleCatalog, type PlanKey } from "@/lib/plans";
import { StatusBadge } from "@/components/ui";

export function UpgradeModuleScreen({
  moduleKey,
  requiredPlan,
}: {
  moduleKey: string;
  requiredPlan?: PlanKey;
}) {
  const moduleInfo = moduleCatalog[moduleKey] ?? {
    name: moduleKey,
    description: "Modulo disponible en un plan superior.",
    requiredPlan: requiredPlan ?? "pro",
    benefits: ["Mayor control operativo", "Mas automatizacion", "Mejor lectura ejecutiva"],
  };
  const plan = requiredPlan ?? moduleInfo.requiredPlan;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <section className="w-full max-w-3xl rounded-lg border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-stone-950 text-white">
          <LockKeyhole size={22} />
        </div>
        <div className="mt-6 flex justify-center">
          <StatusBadge status={plan} />
        </div>
        <h1 className="mt-5 text-3xl font-semibold text-stone-950">
          {moduleInfo.name} esta disponible desde el plan {plan}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-stone-600">
          {moduleInfo.description}
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {moduleInfo.benefits.map((benefit) => (
            <div key={benefit} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <Sparkles className="mx-auto text-stone-500" size={18} />
              <p className="mt-3 text-sm font-medium text-stone-800">{benefit}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/app/configuracion"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800" prefetch={false}>
            Solicitar upgrade
          </Link>
          <Link
            href="/app/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 transition hover:border-stone-300" prefetch={false}>
            Volver al dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
