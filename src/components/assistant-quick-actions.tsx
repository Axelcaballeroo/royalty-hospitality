import Link from "next/link";

const actions = [
  { label: "Nueva reserva", href: "/app/operacion?tab=reservas&action=nueva-reserva" },
  { label: "Nuevo cliente", href: "/app/clientes?action=new" },
  { label: "Registrar consumo", href: "/app/operacion?tab=sala" },
  { label: "Crear campana", href: "/app/marketing" },
  { label: "Registrar merma", href: "/app/inventario?action=waste" },
  { label: "Registrar cortesia", href: "/app/operacion?tab=cierre&action=cortesia" },
  { label: "Nueva tarea", href: "/app/crm-interno" },
];

export function AssistantQuickActions({ compact = false }: { compact?: boolean }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_12px_40px_rgba(28,25,23,0.04)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-950">Acciones rapidas</p>
          {!compact ? (
            <p className="mt-1 text-sm text-stone-500">Royalty Assistant te lleva directo a la siguiente accion.</p>
          ) : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:justify-end">
          {actions.map((action, index) => (
            <Link
              key={action.href}
              href={action.href}
              className={[
                "inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition",
                index === 0
                  ? "bg-stone-950 text-white hover:bg-stone-800"
                  : "border border-stone-200 bg-white text-stone-800 hover:border-stone-300 hover:bg-stone-50",
              ].join(" ")}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
