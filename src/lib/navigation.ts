import {
  BarChart3,
  CalendarDays,
  Clock3,
  Gift,
  HandCoins,
  Home,
  MessageSquareText,
  Megaphone,
  Package,
  Settings,
  Users,
  Utensils,
  Workflow,
} from "lucide-react";

export const privateNavigation = [
  { name: "Dashboard", href: "/app/dashboard", icon: Home, moduleKey: "dashboard" },
  { name: "Reservas", href: "/app/reservas", icon: Clock3, moduleKey: "reservations" },
  { name: "Clientes", href: "/app/clientes", icon: Users, moduleKey: "crm" },
  { name: "CRM Interno", href: "/app/crm-interno", icon: MessageSquareText, moduleKey: "crm" },
  { name: "Calendario", href: "/app/calendario", icon: CalendarDays, moduleKey: "reservations" },
  { name: "Marketing", href: "/app/marketing", icon: Megaphone, moduleKey: "marketing" },
  { name: "Fidelizacion", href: "/app/fidelizacion", icon: Gift, moduleKey: "loyalty" },
  { name: "Wallet", href: "/app/wallet", icon: HandCoins, moduleKey: "wallet_placeholder" },
  { name: "Inventario", href: "/app/inventario", icon: Package, moduleKey: "inventory" },
  { name: "RRHH", href: "/app/rrhh", icon: Utensils, moduleKey: "hr" },
  { name: "Automatizaciones", href: "/app/automatizaciones", icon: Workflow, moduleKey: "automation" },
  { name: "Reportes", href: "/app/reportes", icon: BarChart3, moduleKey: "reports_basic" },
  { name: "Configuracion", href: "/app/configuracion", icon: Settings, moduleKey: "dashboard" },
];

export const moduleHighlights = [
  "Reservas conectadas al perfil del cliente",
  "Historial centralizado de visitas, eventos y preferencias",
  "Modulos activables por negocio",
  "Base multi-tenant preparada para crecimiento",
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
