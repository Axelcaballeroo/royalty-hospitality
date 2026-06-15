-- Optional demo seed for Royalty Hospitality OS.
-- Run manually in a development database after migrations.
-- To access this tenant from the app, link your auth user in business_users.

do $$
declare
  demo_business_id uuid;
  ana_id uuid;
  luis_id uuid;
  sofia_id uuid;
  campaign_id uuid;
  item_id uuid;
  batch_id uuid;
  employee_id uuid;
begin
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
    onboarding_step
  )
  values (
    'Royalty Demo Bistro',
    'royalty-demo-bistro',
    'Restaurante',
    '+52 998 000 0000',
    'demo@royalty.test',
    'Av. Hospitalidad 120',
    'Cancun',
    'Mexico',
    'business',
    'active',
    'https://ui-avatars.com/api/?name=Royalty+Demo+Bistro&background=1c1917&color=ffffff&size=256',
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1600&q=80',
    'Reserva mesa, unete al club y acumula puntos en cada visita. Una experiencia demo conectada de web, reservas, clientes y beneficios.',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    '#1c1917',
    '#10b981',
    true,
    true,
    true,
    6
  )
  on conflict (slug) do update
    set plan = excluded.plan,
        status = excluded.status,
        logo_url = excluded.logo_url,
        cover_url = excluded.cover_url,
        public_description = excluded.public_description,
        menu_pdf_url = excluded.menu_pdf_url,
        website_enabled = excluded.website_enabled,
        reservation_enabled = excluded.reservation_enabled,
        onboarding_completed = excluded.onboarding_completed
  returning id into demo_business_id;

  insert into public.business_settings (
    business_id,
    currency,
    points_per_currency,
    reservation_auto_confirmed,
    reservation_interval_minutes,
    timezone
  )
  values (demo_business_id, 'MXN', 1, false, 30, 'America/Cancun')
  on conflict (business_id) do update
    set currency = excluded.currency,
        points_per_currency = excluded.points_per_currency,
        reservation_auto_confirmed = excluded.reservation_auto_confirmed,
        reservation_interval_minutes = excluded.reservation_interval_minutes,
        timezone = excluded.timezone;

  insert into public.business_modules (business_id, module_key, enabled)
  select demo_business_id, key, true
  from public.modules
  on conflict (business_id, module_key) do update set enabled = true;

  insert into public.customers (business_id, full_name, phone, email, birthday, tags, notes, total_visits, total_spent, last_visit_at, loyalty_code)
  values
    (demo_business_id, 'Ana Martinez', '+529981110001', 'ana.demo@example.com', '1990-04-12', array['vip', 'terraza'], 'Prefiere mesa exterior.', 8, 12400, now() - interval '5 days', 'DEMO-1001'),
    (demo_business_id, 'Luis Herrera', '+529981110002', 'luis.demo@example.com', '1987-09-21', array['cumpleanos'], 'Le gusta vino tinto.', 3, 4200, now() - interval '20 days', 'DEMO-1002'),
    (demo_business_id, 'Sofia Reyes', '+529981110003', 'sofia.demo@example.com', '1995-12-03', array['inactivo'], 'Recuperar con campana.', 1, 900, now() - interval '75 days', 'DEMO-1003')
  on conflict (loyalty_code) do update
    set full_name = excluded.full_name,
        phone = excluded.phone,
        email = excluded.email,
        tags = excluded.tags,
        notes = excluded.notes,
        total_visits = excluded.total_visits,
        total_spent = excluded.total_spent,
        last_visit_at = excluded.last_visit_at;

  select id into ana_id from public.customers where business_id = demo_business_id and phone = '+529981110001' limit 1;
  select id into luis_id from public.customers where business_id = demo_business_id and phone = '+529981110002' limit 1;
  select id into sofia_id from public.customers where business_id = demo_business_id and phone = '+529981110003' limit 1;

  insert into public.reservations (business_id, customer_id, date, time, party_size, status, source, notes)
  values
    (demo_business_id, ana_id, current_date, '19:30', 4, 'confirmed', 'web', 'Aniversario'),
    (demo_business_id, luis_id, current_date + 1, '20:00', 2, 'pending', 'manual', 'Mesa tranquila'),
    (demo_business_id, sofia_id, current_date - 3, '18:30', 3, 'completed', 'instagram', 'Campana promo');

  insert into public.loyalty_accounts (business_id, customer_id, points_balance, tier)
  values
    (demo_business_id, ana_id, 1850, 'gold'),
    (demo_business_id, luis_id, 620, 'silver'),
    (demo_business_id, sofia_id, 90, 'bronze')
  on conflict (business_id, customer_id) do update
    set points_balance = excluded.points_balance,
        tier = excluded.tier;

  insert into public.rewards (business_id, name, description, points_required, status)
  values
    (demo_business_id, 'Postre de cortesia', 'Canje por un postre de la casa.', 400, 'active'),
    (demo_business_id, 'Bebida de bienvenida', 'Bebida gratis en tu proxima visita.', 700, 'active'),
    (demo_business_id, 'Descuento 10%', 'Descuento especial para miembros activos del club.', 1000, 'active'),
    (demo_business_id, 'Cena privada upgrade', 'Beneficio demo para clientes gold.', 1500, 'active');

  insert into public.wallet_accounts (business_id, customer_id, balance, currency, status)
  values
    (demo_business_id, ana_id, 1100, 'MXN', 'active'),
    (demo_business_id, luis_id, 350, 'MXN', 'active')
  on conflict (business_id, customer_id) do update
    set balance = excluded.balance,
        status = excluded.status;

  insert into public.wallet_transactions (business_id, customer_id, type, amount, description, reference)
  values
    (demo_business_id, ana_id, 'topup', 1000, 'Recarga demo', 'DEMO-TOPUP-1'),
    (demo_business_id, ana_id, 'bonus', 100, 'Bono demo', 'DEMO-TOPUP-1'),
    (demo_business_id, luis_id, 'topup', 500, 'Recarga demo', 'DEMO-TOPUP-2'),
    (demo_business_id, luis_id, 'purchase', -150, 'Consumo demo', 'TICKET-002');

  insert into public.campaigns (business_id, name, type, segment_key, message, channel, status, sent_at)
  values (
    demo_business_id,
    'Recuperacion clientes inactivos',
    'inactive_customers',
    'inactive_60d',
    'Hola {{nombre}}, te esperamos en {{negocio}} con una experiencia especial.',
    'manual',
    'sent',
    now() - interval '2 days'
  )
  returning id into campaign_id;

  insert into public.campaign_recipients (business_id, campaign_id, customer_id, status, sent_at)
  values
    (demo_business_id, campaign_id, sofia_id, 'sent', now() - interval '2 days'),
    (demo_business_id, campaign_id, ana_id, 'redeemed', now() - interval '2 days');

  insert into public.inventory_items (business_id, name, category, unit, min_stock, status)
  values (demo_business_id, 'Rib eye premium', 'Carnes', 'kg', 5, 'active')
  returning id into item_id;

  insert into public.inventory_batches (business_id, item_id, quantity, initial_quantity, expiration_date, cost, status)
  values (demo_business_id, item_id, 4, 10, current_date + 2, 420, 'near_expiration')
  returning id into batch_id;

  insert into public.waste_alerts (business_id, item_id, batch_id, risk_level, message, estimated_loss, status)
  values (demo_business_id, item_id, batch_id, 'medium', 'Rib eye premium tiene vencimiento cercano.', 1680, 'open');

  insert into public.employees (business_id, full_name, phone, email, position, status)
  values (demo_business_id, 'Camila Torres', '+529981119000', 'camila.team@example.com', 'Host', 'active')
  returning id into employee_id;

  insert into public.shifts (business_id, employee_id, date, start_time, end_time, role, status)
  values (demo_business_id, employee_id, current_date, '16:00', '23:00', 'Recepcion', 'scheduled');

  insert into public.customer_events (business_id, customer_id, type, title, description)
  values
    (demo_business_id, ana_id, 'customer_created', 'Cliente demo creado', 'Cliente VIP para presentaciones.'),
    (demo_business_id, ana_id, 'wallet_topup', 'Recarga de wallet', 'Cliente recargo 1000 MXN.'),
    (demo_business_id, sofia_id, 'campaign_sent', 'Campana enviada', 'Recuperacion clientes inactivos.');

  insert into public.automation_rules (business_id, name, trigger_type, action_type, enabled, config)
  values
    (demo_business_id, 'Recuperar clientes inactivos', 'customer_inactive_60d', 'create_campaign_draft', true, '{"campaignType":"inactive_customers","segmentKey":"inactive_60d"}'::jsonb),
    (demo_business_id, 'Campana anti-merma urgente', 'waste_alert_created', 'create_campaign_draft', true, '{"campaignType":"waste_reduction","segmentKey":"all_customers"}'::jsonb),
    (demo_business_id, 'Seguimiento cliente Gold', 'customer_reached_gold', 'create_internal_task', true, '{"taskTitle":"Dar seguimiento a cliente Gold","priority":"medium"}'::jsonb)
  on conflict (business_id, name) do nothing;

  insert into public.automation_logs (business_id, rule_id, status, message, metadata)
  select
    demo_business_id,
    id,
    'success',
    'Ejecucion demo de automatizacion creada por seed.',
    jsonb_build_object('demo', true, 'trigger_type', trigger_type, 'action_type', action_type)
  from public.automation_rules
  where business_id = demo_business_id
  limit 2;
end $$;
