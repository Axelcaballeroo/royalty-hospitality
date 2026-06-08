-- Helper manual para convertir un usuario en superadmin.
-- Opcion A: por user_id.
update public.business_users
set role = 'superadmin'
where user_id = 'USER_ID_AQUI';

-- Opcion B: por email de Supabase Auth.
update public.business_users
set role = 'superadmin'
where user_id = (
  select id
  from auth.users
  where email = 'EMAIL_AQUI'
);
