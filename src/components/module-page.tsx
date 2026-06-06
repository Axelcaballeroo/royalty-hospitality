import { Plus } from "lucide-react";
import { routeMeta } from "@/lib/navigation";
import {
  activity,
  alerts,
  customerTimeline,
  customers,
  internalTasks,
  modulePlaceholders,
  reservations,
  stats,
} from "@/lib/mock-data";
import { DataTable, EmptyState, ModuleCard, StatCard, StatusBadge } from "./ui";

export function ModulePage({ module }: { module: keyof typeof routeMeta }) {
  if (module === "dashboard") return <DashboardPage />;
  if (module === "reservas") return <ReservationsPage />;
  if (module === "clientes") return <CustomersPage />;

  return <PlaceholderModule module={module} />;
}

function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-stone-950">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
        {description}
      </p>
    </div>
  );
}

function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Sistema operativo"
        title="Dashboard"
        description="Pulso diario del negocio con clientes, reservas, actividad interna y alertas importantes por tenant."
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} tone={index === 0 ? "dark" : "light"} />
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <ModuleCard title="Actividad reciente" description="Eventos conectados al historial del cliente.">
          <div className="space-y-3">
            {activity.map((item) => (
              <div key={item} className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
                {item}
              </div>
            ))}
          </div>
        </ModuleCard>
        <ModuleCard title="Alertas importantes" description="Puntos que el equipo debe revisar antes del siguiente turno.">
          <div className="space-y-3">
            {alerts.map((item) => (
              <div key={item} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {item}
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>
    </div>
  );
}

function ReservationsPage() {
  const rows = reservations.map((reservation) => [
    <div key="customer">
      <p className="font-medium text-stone-950">{reservation.customer}</p>
      <p className="mt-1 text-xs text-stone-500">{reservation.phone}</p>
    </div>,
    `${reservation.date} ${reservation.time}`,
    reservation.party,
    reservation.source,
    <StatusBadge key="status" status={reservation.status} />,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <PageTitle
          eyebrow="Reservas"
          title="Reservas conectadas al cliente"
          description="Cada reserva mantiene relacion directa con customer_id, historial, notas y tareas internas."
        />
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800">
          <Plus size={17} />
          Crear reserva
        </button>
      </div>
      <DataTable
        columns={["Cliente", "Fecha", "Personas", "Fuente", "Estado"]}
        rows={rows}
      />
    </div>
  );
}

function CustomersPage() {
  const rows = customers.map((customer) => [
    <div key="name">
      <p className="font-medium text-stone-950">{customer.name}</p>
      <p className="mt-1 text-xs text-stone-500">{customer.phone}</p>
    </div>,
    customer.email,
    customer.tags,
    customer.visits,
    customer.spent,
    <StatusBadge key="status" status={customer.status} />,
  ]);

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Clientes CRM"
        title="El cliente como nucleo"
        description="Lista, ficha, timeline, notas internas, tareas y comentarios de equipo preparados para operar alrededor del cliente."
      />
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <ModuleCard title="Lista de clientes" description="Mock funcional para iniciar el CRUD visual.">
          <DataTable
            columns={["Cliente", "Email", "Tags", "Visitas", "Gasto", "Estado"]}
            rows={rows}
          />
        </ModuleCard>
        <ModuleCard title="Ficha de cliente" description="Perfil conectado a historial y preferencias.">
          <div className="rounded-lg bg-stone-950 p-5 text-white">
            <p className="text-xl font-semibold">Camila Torres</p>
            <p className="mt-2 text-sm text-stone-300">VIP, terraza, vino blanco</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-stone-400">Visitas</p>
                <p className="mt-1 font-semibold">14</p>
              </div>
              <div>
                <p className="text-stone-400">Gasto total</p>
                <p className="mt-1 font-semibold">$38,400</p>
              </div>
            </div>
          </div>
        </ModuleCard>
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        <ModuleCard title="Timeline" description="Eventos relevantes del cliente.">
          <div className="space-y-3">
            {customerTimeline.map((item) => (
              <div key={item} className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
                {item}
              </div>
            ))}
          </div>
        </ModuleCard>
        <ModuleCard title="Tareas internas" description="Seguimientos asignables al equipo.">
          <DataTable
            columns={["Tarea", "Cliente", "Prioridad", "Estado"]}
            rows={internalTasks.map(([task, customer, priority, status]) => [
              task,
              customer,
              <StatusBadge key="priority" status={priority} />,
              <StatusBadge key="status" status={status} />,
            ])}
          />
        </ModuleCard>
        <ModuleCard title="Notas y comentarios" description="Comunicacion interna por cliente o reserva.">
          <EmptyState
            title="Sin comentarios nuevos"
            description="Las notas internas y comentarios de equipo quedaran conectados a clientes, reservas y tareas."
          />
        </ModuleCard>
      </section>
    </div>
  );
}

function PlaceholderModule({ module }: { module: keyof typeof routeMeta }) {
  const meta = routeMeta[module];
  const placeholder = modulePlaceholders[module] ?? {
    title: meta.title,
    description: meta.description,
    items: ["Clientes", "Reservas", "Eventos"],
  };

  return (
    <div className="space-y-6">
      <PageTitle eyebrow="Modulo" title={meta.title} description={meta.description} />
      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <ModuleCard title={placeholder.title} description={placeholder.description}>
          <div className="grid gap-3 sm:grid-cols-3">
            {placeholder.items.map((item) => (
              <div key={item} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-950">{item}</p>
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  Preparado por business_id y listo para activar el modulo.
                </p>
              </div>
            ))}
          </div>
        </ModuleCard>
        <ModuleCard title="Estado de etapa 1" description="Estructura preparada, integraciones reales pendientes.">
          <EmptyState
            title="Modulo en preparacion"
            description="No se implementan pagos, WhatsApp real, inventario avanzado, nomina, geolocalizacion ni push notifications."
          />
        </ModuleCard>
      </section>
    </div>
  );
}
