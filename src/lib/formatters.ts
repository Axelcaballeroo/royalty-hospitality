const fallback = (value?: string | null) =>
  value ? value.replaceAll("_", " ") : "";

export function formatPlanName(plan?: string | null) {
  const labels: Record<string, string> = {
    basic: "Plan Basico",
    pro: "Plan Pro",
    premium: "Plan Premium",
    business: "Plan Business",
  };

  return labels[plan ?? ""] ?? fallback(plan);
}

export function formatStatus(status?: string | null) {
  const labels: Record<string, string> = {
    active: "Activo",
    inactive: "Inactivo",
    suspended: "Suspendido",
    pending: "Pendiente",
    in_progress: "En proceso",
    confirmed: "Confirmada",
    completed: "Completada",
    cancelled: "Cancelada",
    no_show: "No asistio",
    scheduled: "Programada",
    draft: "Borrador",
    sent: "Enviada",
    failed: "Fallida",
    skipped: "Omitida",
    opened: "Abierta",
    clicked: "Click registrado",
    redeemed: "Canjeada",
    frozen: "Congelada",
    closed: "Cerrada",
    urgent: "Urgente",
    high: "Alta",
    medium: "Media",
    low: "Baja",
    ok: "Correcto",
    near_expiration: "Por vencer",
    expired: "Vencido",
    used: "Usado",
    working: "Trabajando",
    on_break: "En descanso",
    missed: "No registrada",
    bronze: "Bronce",
    silver: "Plata",
    gold: "Oro",
    black: "Black",
    manual: "Manual",
    whatsapp: "WhatsApp",
    email: "Email",
    sms: "SMS",
    push: "Push",
  };

  return labels[status ?? ""] ?? fallback(status);
}

export function formatModuleName(moduleKey?: string | null) {
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    crm: "Clientes",
    reservations: "Reservas",
    reports_basic: "Reportes basicos",
    reports_advanced: "Reportes avanzados",
    marketing: "Marketing",
    loyalty: "Fidelizacion",
    inventory: "Inventario",
    waste: "Merma",
    wallet_placeholder: "Wallet",
    hr: "RRHH",
    automation: "Automatizaciones",
    multi_location_placeholder: "Multi-sucursal proximamente",
    academy_placeholder: "Academy proximamente",
  };

  return labels[moduleKey ?? ""] ?? fallback(moduleKey);
}

export function formatEventType(type?: string | null) {
  const labels: Record<string, string> = {
    plan_updated: "Plan actualizado correctamente",
    module_updated: "Modulo actualizado correctamente",
    customer_created: "Cliente creado",
    reservation_created: "Reserva creada",
    reservation_confirmed: "Reserva confirmada",
    reservation_cancelled: "Reserva cancelada",
    reservation_no_show: "Cliente no asistio",
    visit_completed: "Visita completada",
    note_added: "Nota agregada",
    task_created: "Tarea creada",
    task_updated: "Tarea actualizada",
    comment_created: "Comentario agregado",
    campaign_created: "Campana creada",
    campaign_sent: "Campana enviada",
    campaign_redeemed: "Campana canjeada",
    wallet_topup: "Recarga de wallet",
    wallet_purchase: "Consumo con wallet",
    wallet_adjustment: "Ajuste de wallet",
    wallet_status_updated: "Estado de wallet actualizado",
    points_earned: "Puntos acumulados",
    reward_redeemed: "Recompensa canjeada",
    points_adjusted: "Puntos ajustados",
    waste_campaign_created: "Campana anti-merma creada",
    business_plan_updated: "Plan actualizado correctamente",
    business_status_updated: "Estado del negocio actualizado",
    business_module_toggled: "Modulo actualizado",
    customer_validation: "Completa nombre y al menos telefono o email",
    customer_updated: "Cliente actualizado correctamente",
    note_validation: "Completa titulo y contenido de la nota",
    note_created: "Nota agregada correctamente",
    task_validation: "Completa el titulo de la tarea",
    comment_validation: "Escribe un comentario",
    comment_target_required: "Selecciona una tarea o nota para comentar",
    reservation_validation: "Completa fecha, hora y numero de personas",
    reservation_unavailable: "Ese horario ya no esta disponible",
    reservations_unavailable: "Reservas no disponibles",
    business_missing: "No se encontro el restaurante",
    customer_required: "Selecciona o captura un cliente",
    invalid_status: "Estado no valido",
    status_updated: "Estado actualizado correctamente",
    reservation_updated: "Reserva actualizada correctamente",
    wallet_create_failed: "No se pudo crear la wallet",
    wallet_created: "Wallet creada correctamente",
    wallet_topup_validation: "Completa cliente y monto de recarga",
    wallet_topup_failed: "No se pudo registrar la recarga",
    wallet_purchase_validation: "Completa wallet y monto de consumo",
    wallet_purchase_failed: "No se pudo registrar el consumo",
    wallet_adjustment_validation: "Completa wallet, monto y motivo",
    wallet_adjustment_failed: "No se pudo registrar el ajuste",
    wallet_status_validation: "Selecciona un estado valido para la wallet",
    wallet_not_active: "La wallet no esta activa",
    insufficient_wallet_balance: "Saldo insuficiente en la wallet",
    item_validation: "Completa los datos del producto",
    waste_alerts_refreshed: "Alertas de merma actualizadas",
    waste_alert_required: "Selecciona una alerta de merma",
    waste_campaign_failed: "No se pudo crear la campana anti-merma",
    campaign_validation: "Completa nombre, segmento y mensaje",
    consumption_validation: "Ingresa un monto valido",
    consumption_failed: "No se pudo registrar el consumo",
    consumption_registered: "Consumo registrado y puntos acumulados",
    reward_validation: "Selecciona una recompensa",
    reward_not_found: "Recompensa no disponible",
    insufficient_points: "Puntos insuficientes",
    reward_redeem_failed: "No se pudo canjear la recompensa",
    promotion: "Promocion",
    birthday: "Cumpleanos",
    inactive_customers: "Clientes inactivos",
    vip: "Clientes VIP",
    reward: "Recompensa",
    waste_reduction: "Anti-merma",
    event: "Evento",
  };

  return labels[type ?? ""] ?? fallback(type);
}

export function formatCampaignStatus(status?: string | null) {
  return formatStatus(status);
}

export function formatReservationStatus(status?: string | null) {
  return formatStatus(status);
}

export function formatRoleName(role?: string | null) {
  const labels: Record<string, string> = {
    superadmin: "Superadmin",
    owner: "Dueno",
    manager: "Gerente",
    staff: "Equipo",
  };

  return labels[role ?? ""] ?? fallback(role);
}

export function formatTransactionType(type?: string | null) {
  const labels: Record<string, string> = {
    topup: "Recarga",
    bonus: "Bono",
    purchase: "Consumo",
    refund: "Reembolso",
    adjustment: "Ajuste",
    earn: "Puntos acumulados",
    redeem: "Canje",
    sale: "Salida por venta",
    entry: "Entrada",
    waste: "Merma",
    transfer: "Transferencia",
  };

  return labels[type ?? ""] ?? fallback(type);
}

export function formatAnyLabel(value?: string | null) {
  const key = value ?? "";
  return (
    formatPlanName(key) !== fallback(key) ? formatPlanName(key) :
    formatModuleName(key) !== fallback(key) ? formatModuleName(key) :
    formatEventType(key) !== fallback(key) ? formatEventType(key) :
    formatTransactionType(key) !== fallback(key) ? formatTransactionType(key) :
    formatStatus(key)
  );
}
