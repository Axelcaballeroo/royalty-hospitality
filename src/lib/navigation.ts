import {
  CalendarDays,
  ClipboardList,
  Home,
  Package,
  Settings,
  Users,
  Utensils,
} from "lucide-react";

export const appNavigation = [
  { name: "Inicio", href: "/app/operacion", icon: Home, moduleKey: "dashboard" },
  { name: "Reservas", href: "/app/reservas", icon: CalendarDays, moduleKey: "reservations" },
  { name: "Punto de Venta", href: "/app/operacion?tab=sala", icon: Utensils, moduleKey: "dashboard" },
  { name: "Inventario", href: "/app/inventario", icon: Package, moduleKey: "inventory" },
  { name: "Clientes", href: "/app/clientes", icon: Users, moduleKey: "crm" },
  { name: "Cierre del Día", href: "/app/operacion?tab=cierre", icon: ClipboardList, moduleKey: "dashboard" },
  { name: "Configuración", href: "/app/configuracion", icon: Settings, moduleKey: "dashboard" },
];

export function canSeeAdminGuidance(role: string) {
  return ["superadmin", "owner", "manager", "admin"].includes(role);
}

export const moduleHighlights = [
  "Reservas conectadas al perfil del cliente",
  "Historial centralizado de visitas, eventos y preferencias",
  "Modulos activables por negocio",
  "Base multi-negocio preparada para crecimiento",
  "Analitica operacional para equipos de hospitalidad",
];

export const routeMeta: Record<
  string,
  { title: string; description: string; metric: string; label: string }
> = {
  dashboard: {
    title: "Dashboard",
    description: "Pulso del negocio, clientes activos y actividad modular.",
    metric: "1,248",
    label: "clientes identificados",
  },
  reservas: {
    title: "Reservas",
    description: "Reservas conectadas a clientes, mesas, eventos e historial.",
    metric: "84",
    label: "reservas esta semana",
  },
  clientes: {
    title: "Clientes",
    description: "El nucleo del sistema: perfiles, historial y relaciones.",
    metric: "312",
    label: "clientes con historial",
  },
  calendario: {
    title: "Calendario",
    description: "Vista operativa de demanda, turnos, reservas y eventos.",
    metric: "19",
    label: "bloques activos",
  },
  marketing: {
    title: "Marketing",
    description: "Segmentos y campanas futuras basadas en comportamiento real.",
    metric: "7",
    label: "segmentos preparados",
  },
  fidelizacion: {
    title: "Fidelizacion",
    description: "Beneficios, membresias y recompensas listas para activar.",
    metric: "4",
    label: "programas planeados",
  },
  wallet: {
    title: "Wallet",
    description: "Modulo reservado para saldos, beneficios y pagos futuros.",
    metric: "0",
    label: "transacciones reales",
  },
  inventario: {
    title: "Inventario",
    description: "Preparado para control avanzado sin implementarlo todavia.",
    metric: "12",
    label: "categorias base",
  },
  rrhh: {
    title: "RRHH",
    description: "Equipo, roles y operacion interna por negocio.",
    metric: "23",
    label: "colaboradores",
  },
  automatizaciones: {
    title: "Automatizaciones",
    description: "Reglas, disparadores y acciones simuladas entre modulos.",
    metric: "5",
    label: "reglas base",
  },
  reportes: {
    title: "Reportes",
    description: "Lectura ejecutiva de clientes, reservas y modulos activos.",
    metric: "9",
    label: "reportes iniciales",
  },
  configuracion: {
    title: "Configuracion",
    description: "Tenant, usuarios, permisos, horarios, mesas y modulos.",
    metric: "6",
    label: "areas configurables",
  },
};
