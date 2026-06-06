export const stats = [
  { title: "Reservas de hoy", value: "128", detail: "32 pendientes por confirmar" },
  { title: "Clientes nuevos", value: "18", detail: "Ultimas 24 horas" },
  { title: "Clientes recurrentes", value: "76%", detail: "Sobre reservas completadas" },
  { title: "No-shows", value: "6", detail: "Requieren seguimiento" },
];

export const reservations = [
  {
    customer: "Camila Torres",
    phone: "+52 984 123 9087",
    date: "Hoy",
    time: "20:30",
    party: "4 pax",
    source: "instagram",
    status: "confirmed",
  },
  {
    customer: "Marco Alvarez",
    phone: "+52 998 321 7701",
    date: "Hoy",
    time: "21:15",
    party: "2 pax",
    source: "manual",
    status: "pending",
  },
  {
    customer: "Sofia Mendoza",
    phone: "+52 984 552 1190",
    date: "Manana",
    time: "19:45",
    party: "6 pax",
    source: "web",
    status: "completed",
  },
  {
    customer: "Andres Lara",
    phone: "+52 984 663 1209",
    date: "Viernes",
    time: "22:00",
    party: "8 pax",
    source: "whatsapp",
    status: "no_show",
  },
];

export const customers = [
  {
    name: "Camila Torres",
    phone: "+52 984 123 9087",
    email: "camila@example.com",
    tags: "VIP, terraza",
    visits: "14",
    spent: "$38,400",
    status: "active",
  },
  {
    name: "Marco Alvarez",
    phone: "+52 998 321 7701",
    email: "marco@example.com",
    tags: "vino, aniversario",
    visits: "5",
    spent: "$12,900",
    status: "active",
  },
  {
    name: "Sofia Mendoza",
    phone: "+52 984 552 1190",
    email: "sofia@example.com",
    tags: "familia, brunch",
    visits: "9",
    spent: "$21,500",
    status: "active",
  },
];

export const activity = [
  "Reserva confirmada para Camila Torres",
  "Nota interna agregada a Marco Alvarez",
  "Campana enviada al segmento clientes VIP",
  "Tarea creada para seguimiento de no-show",
];

export const alerts = [
  "6 no-shows requieren contacto del equipo",
  "3 reservas grandes aun no tienen mesa asignada",
  "Wallet, pagos y WhatsApp permanecen en modo preparacion",
];

export const customerTimeline = [
  "reservation_created: Mesa para 4, terraza",
  "reservation_confirmed: Confirmada por manager",
  "note_added: Prefiere mesa lejos de bocinas",
  "visit_completed: Ticket alto, experiencia positiva",
];

export const internalTasks = [
  ["Confirmar alergias", "Camila Torres", "urgent", "pending"],
  ["Enviar beneficio cumpleanos", "Marco Alvarez", "medium", "in_progress"],
  ["Validar preferencia de mesa", "Sofia Mendoza", "low", "completed"],
];

export const modulePlaceholders: Record<
  string,
  { title: string; description: string; items: string[] }
> = {
  calendario: {
    title: "Calendario operativo",
    description: "Vista preparada para mezclar reservas, tareas y seguimientos.",
    items: ["Reservas por turno", "Tareas por responsable", "Seguimientos CRM"],
  },
  marketing: {
    title: "Campanas y segmentos",
    description: "Marketing se activara sobre comportamiento real de clientes.",
    items: ["Clientes VIP", "Cumpleanos del mes", "No-shows recuperables"],
  },
  fidelizacion: {
    title: "Puntos, niveles y beneficios",
    description: "Estructura lista para programas de lealtad futuros.",
    items: ["Bronze", "Gold", "Black"],
  },
  wallet: {
    title: "Saldo, recargas y movimientos",
    description: "Placeholder sin pagos reales ni wallet transaccional.",
    items: ["Saldo simulado", "Recargas futuras", "Movimientos futuros"],
  },
  inventario: {
    title: "Productos, existencia, vigencias y merma",
    description: "Base visual sin inventario avanzado en esta etapa.",
    items: ["Bebidas", "Insumos frescos", "Merma reportada"],
  },
  rrhh: {
    title: "Empleados, turnos y checador",
    description: "RRHH queda preparado sin nomina ni app movil.",
    items: ["Equipo activo", "Turnos", "Asistencia"],
  },
  reportes: {
    title: "Metricas generales",
    description: "Lectura ejecutiva de reservas, clientes y modulos.",
    items: ["Ventas estimadas", "Visitas", "Retencion"],
  },
  configuracion: {
    title: "Datos del negocio",
    description: "Tenant, horarios, usuarios, modulos activos y plan contratado.",
    items: ["Demo Restaurant Group", "America/Cancun", "Plan basic"],
  },
};
