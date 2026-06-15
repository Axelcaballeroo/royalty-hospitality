-- Optional premium commercial demo seed for Royalty Hospitality OS.
-- Run manually in a development/staging database after migrations.
-- To access this tenant from the app, link your auth user in business_users.

do $$
declare
  demo_business_id uuid;
  maria_id uuid;
  salmon_id uuid;
  salmon_batch_id uuid;
  campaign_id uuid;
  employee_id uuid;
begin
  delete from public.businesses
  where slug in ('demo', 'royalty-demo-bistro');

  insert into public.businesses (
    name,
    slug,
    type,
    phone,
    email,
    address,
    city,
    country,
    plan,
    status,
    logo_url,
    cover_url,
    public_description,
    menu_pdf_url,
    brand_primary_color,
    brand_secondary_color,
    website_enabled,
    reservation_enabled,
    onboarding_completed,
    onboarding_step,
    timezone
  )
  values (
    'Sakura Sushi House',
    'demo',
    'Restaurante japones',
    '+52 998 410 2020',
    'hola@sakurasushi.demo',
    'Av. Bonampak 128, Zona Hotelera',
    'Cancun',
    'Mexico',
    'business',
    'active',
    'https://ui-avatars.com/api/?name=Sakura+Sushi&background=111827&color=ffffff&size=256',
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1800&q=85',
    'Restaurante japones premium especializado en sushi y cocina asiatica.',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    '#111827',
    '#f43f5e',
    true,
    true,
    true,
    8,
    'America/Cancun'
  )
  returning id into demo_business_id;

  insert into public.business_settings (
    business_id,
    currency,
    points_per_currency,
    reservation_auto_confirmed,
    reservation_interval_minutes,
    timezone
  )
  values (demo_business_id, 'MXN', 0.01, true, 30, 'America/Cancun')
  on conflict (business_id) do update
    set currency = excluded.currency,
        points_per_currency = excluded.points_per_currency,
        reservation_auto_confirmed = excluded.reservation_auto_confirmed,
        reservation_interval_minutes = excluded.reservation_interval_minutes,
        timezone = excluded.timezone;

  insert into public.business_hours (business_id, day_of_week, opens_at, closes_at, is_closed)
  select demo_business_id, day_number, '13:00'::time, '23:30'::time, false
  from generate_series(0, 6) as day_number
  on conflict (business_id, day_of_week) do update
    set opens_at = excluded.opens_at,
        closes_at = excluded.closes_at,
        is_closed = excluded.is_closed;

  insert into public.tables (business_id, name, area, capacity)
  values
    (demo_business_id, 'Mesa 1', 'Salon', 2),
    (demo_business_id, 'Mesa 4', 'Salon', 4),
    (demo_business_id, 'Mesa 8', 'Terraza', 4),
    (demo_business_id, 'Barra 2', 'Barra omakase', 2)
  on conflict (business_id, name) do update
    set area = excluded.area,
        capacity = excluded.capacity;

  insert into public.business_modules (business_id, module_key, enabled)
  select demo_business_id, key, true
  from public.modules
  on conflict (business_id, module_key) do update set enabled = true;

  insert into public.customers (
    business_id,
    full_name,
    phone,
    email,
    birthday,
    tags,
    notes,
    total_visits,
    total_spent,
    last_visit_at,
    loyalty_code,
    loyalty_enabled,
    status
  )
  select
    demo_business_id,
    item.full_name,
    item.phone,
    item.email,
    item.birthday::date,
    item.tags,
    item.notes,
    item.total_visits,
    item.total_spent,
    item.last_visit_at,
    item.loyalty_code,
    true,
    'active'
  from (values
    ('Maria Gonzalez', '+529981200001', 'maria.gonzalez@sakura.demo', '1991-05-18', array['vip', 'omakase'], 'Cliente demo para Mi Club. Prefiere barra omakase.', 24, 68500, now() - interval '2 days', 'SAKURA-1001'),
    ('Carlos Tanaka', '+529981200002', 'carlos.tanaka@sakura.demo', '1986-11-04', array['vip', 'sake'], 'Compra botellas premium.', 19, 54200, now() - interval '4 days', 'SAKURA-1002'),
    ('Andrea Ruiz', '+529981200003', 'andrea.ruiz@sakura.demo', '1994-02-10', array['vip', 'terraza'], 'Celebra aniversarios.', 17, 48600, now() - interval '1 day', 'SAKURA-1003'),
    ('Hiroshi Nakamura', '+529981200004', 'hiroshi.nakamura@sakura.demo', '1983-08-22', array['vip'], 'Pide nigiri de atun.', 21, 72300, now() - interval '6 days', 'SAKURA-1004'),
    ('Paola Cardenas', '+529981200005', 'paola.cardenas@sakura.demo', '1990-06-16', array['vip', 'cumpleanos'], 'Cumpleanos esta semana.', 15, 39800, now() - interval '3 days', 'SAKURA-1005'),
    ('Roberto Silva', '+529981200006', 'roberto.silva@sakura.demo', '1988-01-14', array['activo'], 'Activo de comida ejecutiva.', 9, 14600, now() - interval '5 days', 'SAKURA-1006'),
    ('Fernanda Ibarra', '+529981200007', 'fernanda.ibarra@sakura.demo', '1993-06-08', array['activo'], 'Prefiere rollos sin queso.', 8, 13200, now() - interval '7 days', 'SAKURA-1007'),
    ('Diego Romero', '+529981200008', 'diego.romero@sakura.demo', '1989-03-19', array['activo'], 'Reserva por WhatsApp.', 10, 17100, now() - interval '9 days', 'SAKURA-1008'),
    ('Lucia Torres', '+529981200009', 'lucia.torres@sakura.demo', '1995-06-18', array['activo', 'cumpleanos'], 'Cumpleanos esta semana.', 7, 11100, now() - interval '4 days', 'SAKURA-1009'),
    ('Javier Montes', '+529981200010', 'javier.montes@sakura.demo', '1987-07-27', array['activo'], 'Mesa tranquila.', 11, 19300, now() - interval '10 days', 'SAKURA-1010'),
    ('Valeria Soto', '+529981200011', 'valeria.soto@sakura.demo', '1992-04-09', array['activo'], 'Pide ramen vegetariano.', 6, 9200, now() - interval '12 days', 'SAKURA-1011'),
    ('Emilio Vargas', '+529981200012', 'emilio.vargas@sakura.demo', '1985-10-13', array['activo'], 'Fan de makis picantes.', 7, 10300, now() - interval '8 days', 'SAKURA-1012'),
    ('Natalia Vega', '+529981200013', 'natalia.vega@sakura.demo', '1996-12-29', array['activo'], 'Viene con equipo de trabajo.', 5, 8700, now() - interval '11 days', 'SAKURA-1013'),
    ('Mateo Rios', '+529981200014', 'mateo.rios@sakura.demo', '1990-02-24', array['activo'], 'Reserva viernes.', 8, 12600, now() - interval '6 days', 'SAKURA-1014'),
    ('Camila Ortega', '+529981200015', 'camila.ortega@sakura.demo', '1991-06-30', array['activo'], 'Le gusta sake frio.', 6, 9800, now() - interval '14 days', 'SAKURA-1015'),
    ('Renata Molina', '+529981200016', 'renata.molina@sakura.demo', '1997-05-03', array['ocasional'], 'Visita mensual.', 3, 4600, now() - interval '31 days', 'SAKURA-1016'),
    ('Santiago Leon', '+529981200017', 'santiago.leon@sakura.demo', '1984-09-06', array['ocasional'], 'Mesa para familia.', 4, 7200, now() - interval '39 days', 'SAKURA-1017'),
    ('Alicia Mendez', '+529981200018', 'alicia.mendez@sakura.demo', '1998-06-20', array['ocasional', 'cumpleanos'], 'Cumpleanos esta semana.', 2, 3100, now() - interval '45 days', 'SAKURA-1018'),
    ('Bruno Castillo', '+529981200019', 'bruno.castillo@sakura.demo', '1982-01-09', array['ocasional'], 'Pide delivery.', 3, 3900, now() - interval '52 days', 'SAKURA-1019'),
    ('Isabel Navarro', '+529981200020', 'isabel.navarro@sakura.demo', '1993-08-11', array['ocasional'], 'Prefiere mesas exteriores.', 4, 6100, now() - interval '58 days', 'SAKURA-1020'),
    ('Gustavo Prieto', '+529981200021', 'gustavo.prieto@sakura.demo', '1981-11-20', array['inactivo'], 'Recuperar con promocion.', 2, 2800, now() - interval '75 days', 'SAKURA-1021'),
    ('Claudia Salas', '+529981200022', 'claudia.salas@sakura.demo', '1994-07-18', array['inactivo'], 'Sin visita reciente.', 1, 1600, now() - interval '82 days', 'SAKURA-1022'),
    ('Manuel Fuentes', '+529981200023', 'manuel.fuentes@sakura.demo', '1986-04-17', array['inactivo'], 'Recuperar con bebida gratis.', 2, 2400, now() - interval '96 days', 'SAKURA-1023'),
    ('Elena Ponce', '+529981200024', 'elena.ponce@sakura.demo', '1991-10-26', array['inactivo'], 'Antigua cliente de terraza.', 1, 1400, now() - interval '110 days', 'SAKURA-1024'),
    ('Oscar Medina', '+529981200025', 'oscar.medina@sakura.demo', '1989-12-07', array['inactivo'], 'No responde WhatsApp.', 3, 5200, now() - interval '125 days', 'SAKURA-1025')
  ) as item(full_name, phone, email, birthday, tags, notes, total_visits, total_spent, last_visit_at, loyalty_code);

  insert into public.customers (
    business_id,
    full_name,
    phone,
    email,
    birthday,
    tags,
    notes,
    total_visits,
    total_spent,
    last_visit_at,
    loyalty_code,
    loyalty_enabled,
    status
  )
  select
    demo_business_id,
    'Cliente Sakura ' || gs,
    '+5299820' || lpad(gs::text, 5, '0'),
    'cliente' || gs || '@sakura.demo',
    (date '1980-01-01' + ((gs * 37) % 9000))::date,
    case
      when gs <= 7 then array['inactivo']
      when gs % 19 = 0 then array['cumpleanos']
      else array['activo']
    end,
    'Cliente generado para mostrar escala comercial.',
    1 + (gs % 14),
    850 + (gs * 137),
    case
      when gs <= 7 then now() - ((70 + gs) || ' days')::interval
      else now() - ((gs % 28) || ' days')::interval
    end,
    'SAKURA-G' || lpad(gs::text, 4, '0'),
    true,
    'active'
  from generate_series(26, 248) as gs;

  select id into maria_id
  from public.customers
  where business_id = demo_business_id
    and loyalty_code = 'SAKURA-1001'
  limit 1;

  insert into public.loyalty_accounts (business_id, customer_id, points_balance, tier)
  select
    business_id,
    id,
    case
      when loyalty_code = 'SAKURA-1001' then 1850
      when tags && array['vip'] then 2600
      when tags && array['activo'] then 820
      when loyalty_code in ('SAKURA-1016', 'SAKURA-1017') then 420
      when tags && array['ocasional'] then 260
      else 180
    end,
    case
      when loyalty_code = 'SAKURA-1001' then 'gold'
      when tags && array['vip'] then 'black'
      when tags && array['activo'] then 'silver'
      else 'bronze'
    end
  from public.customers
  where business_id = demo_business_id
  on conflict (business_id, customer_id) do update
    set points_balance = excluded.points_balance,
        tier = excluded.tier,
        updated_at = now();

  insert into public.rewards (business_id, name, description, points_required, status)
  values
    (demo_business_id, 'Postre gratis', 'Postre japones de la casa.', 500, 'active'),
    (demo_business_id, 'Bebida gratis', 'Bebida sin alcohol o te japones.', 750, 'active'),
    (demo_business_id, '10% descuento', 'Descuento para tu siguiente visita.', 1000, 'active'),
    (demo_business_id, 'Botella premium', 'Botella seleccionada para mesa VIP.', 2500, 'active'),
    (demo_business_id, 'Cena especial', 'Experiencia omakase para dos personas.', 5000, 'active');

  insert into public.reservations (business_id, customer_id, date, time, party_size, status, source, notes, special_request)
  select demo_business_id, c.id, current_date, r.time::time, r.party_size, r.status, r.source, r.notes, r.special_request
  from (values
    ('SAKURA-1001', '18:30', 2, 'confirmed', 'web', 'Cliente VIP llega hoy.', 'Barra omakase'),
    ('SAKURA-1002', '19:00', 4, 'confirmed', 'manual', 'Mesa con botella premium.', 'Mesa 8'),
    ('SAKURA-1006', '19:30', 3, 'pending', 'whatsapp', 'Confirmar asistencia.', 'Salon'),
    ('SAKURA-1007', '20:00', 2, 'completed', 'web', 'Check-in activo.', 'Mesa 1'),
    ('SAKURA-1008', '20:15', 4, 'completed', 'google', 'Check-in activo.', 'Mesa 4'),
    ('SAKURA-1009', '20:45', 2, 'completed', 'instagram', 'Cumpleanos esta semana.', 'Barra 2'),
    ('SAKURA-1010', '21:00', 5, 'pending', 'web', 'Pendiente de confirmar.', 'Terraza'),
    ('SAKURA-1011', '21:30', 2, 'completed', 'manual', 'Check-in activo.', 'Salon')
  ) as r(code, time, party_size, status, source, notes, special_request)
  join public.customers c on c.business_id = demo_business_id and c.loyalty_code = r.code;

  insert into public.reservations (business_id, customer_id, date, time, party_size, status, source, notes)
  select
    demo_business_id,
    c.id,
    current_date - ((gs % 27) + 1),
    ('18:00'::time + ((gs % 8) || ' hours')::interval),
    2 + (gs % 5),
    'completed',
    case when gs % 4 = 0 then 'web' when gs % 4 = 1 then 'google' when gs % 4 = 2 then 'instagram' else 'manual' end,
    'Reserva completada demo'
  from generate_series(1, 83) as gs
  join lateral (
    select id
    from public.customers
    where business_id = demo_business_id
    order by (id::text || gs::text)
    limit 1
  ) c on true;

  insert into public.loyalty_transactions (business_id, customer_id, type, points, description, created_at)
  select demo_business_id, maria_id, 'earn', points, description, created_at
  from (values
    (420, 'Cena omakase', now() - interval '3 days'),
    (180, 'Visita barra sushi', now() - interval '12 days'),
    (250, 'Mesa terraza', now() - interval '24 days'),
    (-500, 'Canje postre gratis', now() - interval '35 days')
  ) as tx(points, description, created_at);

  insert into public.customer_events (business_id, customer_id, type, title, description, created_at)
  select demo_business_id, maria_id, type, title, description, created_at
  from (values
    ('customer_created', 'Miembro del club', 'Maria se registro al club Sakura.', now() - interval '5 months'),
    ('visit_completed', 'Visita completada', 'Cena omakase con puntos acumulados.', now() - interval '3 days'),
    ('points_earned', 'Puntos ganados', 'Sumo puntos por consumo.', now() - interval '3 days'),
    ('reward_redeemed', 'Beneficio canjeado', 'Canjeo postre gratis.', now() - interval '35 days')
  ) as ev(type, title, description, created_at);

  insert into public.inventory_items (business_id, name, category, unit, min_stock, status)
  values
    (demo_business_id, 'Salmon', 'Pescados', 'kg', 8, 'active'),
    (demo_business_id, 'Atun', 'Pescados', 'kg', 6, 'active'),
    (demo_business_id, 'Arroz sushi', 'Secos', 'kg', 20, 'active'),
    (demo_business_id, 'Queso crema', 'Lacteos', 'kg', 5, 'active'),
    (demo_business_id, 'Alga nori', 'Secos', 'pack', 10, 'active');

  select id into salmon_id
  from public.inventory_items
  where business_id = demo_business_id and name = 'Salmon'
  limit 1;

  insert into public.inventory_batches (business_id, item_id, quantity, initial_quantity, expiration_date, cost, status)
  select demo_business_id, item.id, batch.quantity, batch.initial_quantity, batch.expiration_date, batch.cost, batch.status
  from public.inventory_items item
  join (values
    ('Salmon', 5, 12, current_date + 1, 640, 'urgent'),
    ('Atun', 9, 14, current_date + 4, 580, 'near_expiration'),
    ('Arroz sushi', 42, 50, current_date + 90, 68, 'ok'),
    ('Queso crema', 4, 10, current_date + 5, 120, 'near_expiration'),
    ('Alga nori', 18, 24, current_date + 120, 95, 'ok')
  ) as batch(name, quantity, initial_quantity, expiration_date, cost, status)
    on batch.name = item.name
  where item.business_id = demo_business_id;

  select id into salmon_batch_id
  from public.inventory_batches
  where business_id = demo_business_id
    and item_id = salmon_id
  order by expiration_date asc
  limit 1;

  insert into public.waste_alerts (business_id, item_id, batch_id, risk_level, message, estimated_loss, status)
  values (
    demo_business_id,
    salmon_id,
    salmon_batch_id,
    'urgent',
    'Salmon vence manana. Conviene convertirlo en promocion hoy.',
    3200,
    'open'
  );

  insert into public.inventory_movements (business_id, item_id, batch_id, type, quantity, reason, created_at)
  select demo_business_id, item_id, id, 'entry', initial_quantity, 'Entrada demo de inventario', now() - interval '5 days'
  from public.inventory_batches
  where business_id = demo_business_id;

  insert into public.daily_closures (
    business_id,
    date,
    summary,
    estimated_sales,
    completed_reservations,
    no_shows,
    courtesy_total,
    waste_total,
    incidents,
    manager_notes,
    status
  )
  values (
    demo_business_id,
    current_date,
    'Servicio con alta demanda de barra omakase.',
    48500,
    4,
    0,
    1800,
    3200,
    null,
    'Revisar promocion de salmon antes del cierre.',
    'draft'
  )
  on conflict (business_id, date) do update
    set summary = excluded.summary,
        estimated_sales = excluded.estimated_sales,
        completed_reservations = excluded.completed_reservations,
        no_shows = excluded.no_shows,
        courtesy_total = excluded.courtesy_total,
        waste_total = excluded.waste_total,
        incidents = excluded.incidents,
        manager_notes = excluded.manager_notes,
        status = excluded.status,
        updated_at = now();

  insert into public.campaigns (business_id, name, type, segment_key, message, channel, status, sent_at)
  values (
    demo_business_id,
    'Recuperar 12 clientes inactivos',
    'inactive_customers',
    'inactive_60d',
    'Te extranamos en Sakura Sushi House. Esta semana tenemos una experiencia especial para que vuelvas.',
    'whatsapp',
    'sent',
    now() - interval '3 days'
  )
  returning id into campaign_id;

  insert into public.campaigns (business_id, name, type, segment_key, message, channel, status, scheduled_at)
  values
    (demo_business_id, 'Promocionar salmon', 'waste_reduction', 'all_customers', 'Hoy tenemos una promocion especial en productos seleccionados. Reserva o visitanos antes de que termine el dia.', 'whatsapp', 'draft', now() + interval '1 hour'),
    (demo_business_id, 'Cumpleanos de la semana', 'birthday', 'birthday_month', 'Celebra tu cumpleanos con un detalle especial de Sakura Sushi House.', 'whatsapp', 'draft', now() + interval '2 hours'),
    (demo_business_id, 'Clientes cerca de recompensa', 'reward', 'customers_near_reward', 'Estas cerca de desbloquear un beneficio. Te esperamos esta semana.', 'whatsapp', 'draft', now() + interval '1 day');

  insert into public.campaign_recipients (business_id, campaign_id, customer_id, status, sent_at)
  select demo_business_id, campaign_id, id, 'sent', now() - interval '3 days'
  from public.customers
  where business_id = demo_business_id
    and tags && array['inactivo']
  limit 12
  on conflict (campaign_id, customer_id) do update
    set status = excluded.status,
        sent_at = excluded.sent_at;

  insert into public.employees (business_id, full_name, phone, email, position, status)
  values
    (demo_business_id, 'Yuki Herrera', '+529981209001', 'yuki@sakura.demo', 'Host', 'active'),
    (demo_business_id, 'Renzo Kimura', '+529981209002', 'renzo@sakura.demo', 'Sushi chef', 'active'),
    (demo_business_id, 'Mina Lopez', '+529981209003', 'mina@sakura.demo', 'Mesera', 'active'),
    (demo_business_id, 'Sofia Park', '+529981209004', 'sofia.park@sakura.demo', 'Gerente', 'active');

  insert into public.shifts (business_id, employee_id, date, start_time, end_time, role, status)
  select demo_business_id, id, current_date, '16:00'::time, '23:30'::time, position, 'scheduled'
  from public.employees
  where business_id = demo_business_id;

  insert into public.time_clock_entries (business_id, employee_id, clock_in, notes)
  select demo_business_id, id, now() - interval '3 hours', 'Check-in activo demo'
  from public.employees
  where business_id = demo_business_id
  limit 4;

  insert into public.internal_tasks (business_id, title, description, priority, status, due_date)
  values
    (demo_business_id, 'Confirmar reserva de Roberto', 'Llamar antes de las 18:00.', 'medium', 'pending', now() + interval '2 hours'),
    (demo_business_id, 'Crear promocion de salmon', 'Usar alerta de inventario para evitar perdida.', 'high', 'pending', now() + interval '1 hour'),
    (demo_business_id, 'Revisar cumpleanos de la semana', 'Preparar cortesia para tres clientes.', 'low', 'pending', now() + interval '1 day');

  insert into public.automation_rules (business_id, name, trigger_type, action_type, enabled, config)
  values
    (demo_business_id, 'Recuperar clientes inactivos', 'customer_inactive_60d', 'create_campaign_draft', true, '{"campaignType":"inactive_customers","segmentKey":"inactive_60d"}'::jsonb),
    (demo_business_id, 'Campana anti-merma urgente', 'waste_alert_created', 'create_campaign_draft', true, '{"campaignType":"waste_reduction","segmentKey":"all_customers"}'::jsonb),
    (demo_business_id, 'Seguimiento cliente VIP', 'customer_reached_gold', 'create_internal_task', true, '{"taskTitle":"Dar seguimiento a cliente VIP","priority":"medium"}'::jsonb)
  on conflict (business_id, name) do nothing;
end $$;
