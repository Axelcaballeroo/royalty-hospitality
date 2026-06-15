import {
  BarChart3,
  AlertTriangle,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Crown,
  FileWarning,
  Gift,
  HelpCircle,
  MessageSquareText,
  Megaphone,
  Package,
  QrCode,
  Route,
  Settings,
  CheckCircle2,
  Users,
  Utensils,
  Workflow,
} from "lucide-react";

export const navigationGroups = [
  {
    label: "Operacion",
    icon: ClipboardList,
    items: [
      { name: "Centro Operativo", href: "/app/operacion", icon: ClipboardList, moduleKey: "dashboard" },
    ],
  },
  {
    label: "Clientes",
    icon: Users,
    items: [
      { name: "Centro de Clientes", href: "/app/clientes", icon: Users, moduleKey: "crm" },
    ],
  },
  {
    label: "Inventario",
    icon: Package,
    items: [
      { name: "Stock", href: "/app/inventario", icon: Package, moduleKey: "inventory" },
      { name: "Productos por vencer", href: "/app/inventario?view=vencimientos", icon: AlertTriangle, moduleKey: "inventory" },
      { name: "Mermas", href: "/app/inventario?view=mermas", icon: FileWarning, moduleKey: "inventory" },
      { name: "Movimientos", href: "/app/inventario?view=movimientos", icon: Route, moduleKey: "inventory" },
    ],
  },
  {
    label: "Marketing",
    icon: Megaphone,
    items: [
      { name: "Campanas", href: "/app/marketing", icon: Megaphone, moduleKey: "marketing" },
      { name: "Clientes inactivos", href: "/app/marketing?segment=inactive_60d", icon: Users, moduleKey: "marketing" },
      { name: "Cumpleanos", href: "/app/marketing?segment=birthday_month", icon: Gift, moduleKey: "marketing" },
      { name: "Promociones", href: "/app/marketing?type=promotion", icon: Megaphone, moduleKey: "marketing" },
      { name: "Clientes VIP", href: "/app/marketing?segment=vip_customers", icon: Crown, moduleKey: "marketing" },
    ],
  },
  {
    label: "Equipo",
    icon: Utensils,
    items: [
      { name: "Empleados", href: "/app/rrhh", icon: Utensils, moduleKey: "hr" },
      { name: "Turnos", href: "/app/rrhh", icon: CalendarDays, moduleKey: "hr" },
      { name: "Tareas internas", href: "/app/crm-interno", icon: ClipboardCheck, moduleKey: "crm" },
      { name: "CRM interno", href: "/app/crm-interno", icon: MessageSquareText, moduleKey: "crm" },
      { name: "Checador RRHH", href: "/app/rrhh/checador", icon: QrCode, moduleKey: "hr" },
    ],
  },
  {
    label: "Reportes",
    icon: BarChart3,
    items: [
      { name: "Ventas", href: "/app/reportes?period=month", icon: BarChart3, moduleKey: "reports_basic" },
      { name: "Clientes", href: "/app/reportes?period=90d", icon: Users, moduleKey: "reports_basic" },
      { name: "Marketing", href: "/app/reportes?period=month", icon: Megaphone, moduleKey: "reports_basic" },
      { name: "Inventario", href: "/app/reportes?period=month", icon: Package, moduleKey: "reports_basic" },
      { name: "Operacion", href: "/app/reportes?period=today", icon: ClipboardList, moduleKey: "reports_basic" },
    ],
  },
];

export const footerNavigation = [
  {
    name: "Configuracion",
    href: "/app/configuracion",
    icon: Settings,
    moduleKey: "dashboard",
    children: [
      { name: "Primeros pasos", href: "/app/onboarding", icon: CheckCircle2, moduleKey: "dashboard" },
      { name: "Automatizaciones", href: "/app/automatizaciones", icon: Workflow, moduleKey: "automation" },
    ],
  },
  { name: "Ayuda", href: "/app/ayuda", icon: HelpCircle, moduleKey: "dashboard" },
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
