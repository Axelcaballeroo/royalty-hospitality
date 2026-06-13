import Link from "next/link";
import { BookOpen, CheckCircle2, XCircle } from "lucide-react";
import { ModuleCard, SectionHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const roleGuides = [
  {
    title: "Superadmin",
    does: "Administra negocios, planes, usuarios y modulos disponibles.",
    can: "Puede revisar el estado general de la plataforma, activar planes y apoyar a cada negocio.",
    cannot: "No reemplaza la operacion diaria del restaurante ni atiende clientes finales.",
  },
  {
    title: "Dueno",
    does: "Dirige la operacion del negocio y decide como usar clientes, marketing, inventario, equipo y reportes.",
    can: "Puede crear clientes, revisar ventas, coordinar al equipo, lanzar promociones y medir resultados.",
    cannot: "No necesita entrar como cliente final ni usar cuentas publicas del club.",
  },
  {
    title: "Staff",
    does: "Atiende la operacion diaria: reservas, check-in, consumos, recompensas y tareas asignadas.",
    can: "Puede buscar clientes, registrar consumos, canjear beneficios y apoyar el seguimiento.",
    cannot: "No debe cambiar planes, configuraciones sensibles ni decisiones comerciales del negocio.",
  },
  {
    title: "Cliente",
    does: "Usa el club oficial del restaurante para ver puntos, recompensas e historial.",
    can: "Puede registrarse, iniciar sesion con telefono y codigo de socio, y mostrar su QR al staff.",
    cannot: "No entra al panel administrativo ni ve informacion interna del negocio.",
  },
];

const ownerManual = [
  ["Reservas", "Crea y confirma reservas, conecta cada visita con un cliente y conserva notas utiles para el servicio."],
  ["Clientes", "Guarda datos, historial, puntos, reservas y beneficios de cada persona."],
  ["CRM Interno", "Coordina tareas, notas y comentarios del equipo sin mezclarlo con la ficha comercial del cliente."],
  ["Fidelizacion", "Define recompensas, revisa niveles y ayuda a que los clientes vuelvan."],
  ["Marketing", "Envia promociones a clientes frecuentes, VIP, inactivos o segmentos especiales."],
  ["Inventario", "Controla productos, lotes, vencimientos y alertas para reducir perdidas."],
  ["RRHH", "Gestiona empleados, turnos, asistencia y actividad diaria del equipo."],
  ["Reportes", "Analiza reservas, clientes, fidelizacion, marketing, merma y equipo en un solo lugar."],
];

const customerManual = [
  ["Registrarse", "El cliente entra al club del restaurante, deja nombre y telefono, y recibe su codigo de socio."],
  ["Ver puntos", "Desde Mi cuenta puede consultar su nivel y puntos actuales."],
  ["Usar recompensas", "El cliente revisa beneficios disponibles y el staff realiza el canje cuando corresponda."],
  ["Mostrar QR", "El cliente toca Mostrar QR para que el staff identifique su cuenta rapidamente."],
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Centro de ayuda"
        title="Aprende a usar Royalty Hospitality OS"
        description="Guias simples para vender, operar y explicar el sistema sin lenguaje tecnico."
        actions={
          <Link
            href="/app/demo"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            Ver recorrido guiado
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {roleGuides.map((guide) => (
          <ModuleCard key={guide.title} title={guide.title} description={guide.does}>
            <div className="space-y-3">
              <p className="flex gap-2 text-sm leading-6 text-stone-600">
                <CheckCircle2 className="mt-1 shrink-0 text-emerald-600" size={16} />
                {guide.can}
              </p>
              <p className="flex gap-2 text-sm leading-6 text-stone-600">
                <XCircle className="mt-1 shrink-0 text-red-600" size={16} />
                {guide.cannot}
              </p>
            </div>
          </ModuleCard>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ModuleCard title="Manual del dueno" description="Como entender cada area del sistema en lenguaje simple.">
          <div className="grid gap-3">
            {ownerManual.map(([title, description]) => (
              <div key={title} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-stone-950">
                  <BookOpen size={16} />
                  {title}
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
              </div>
            ))}
          </div>
        </ModuleCard>

        <ModuleCard title="Manual del cliente" description="Como vive el club una persona que visita el restaurante.">
          <div className="grid gap-3">
            {customerManual.map(([title, description]) => (
              <div key={title} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
              </div>
            ))}
          </div>
        </ModuleCard>
      </section>
    </div>
  );
}
