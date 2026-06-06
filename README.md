# Royalty Hospitality OS

SaaS multi-tenant para negocios de hosteleria y gastronomia. La plataforma esta pensada como un sistema modular donde el cliente es el nucleo: cada reserva, evento y modulo debe poder conectarse a un perfil con historial.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- Supabase
- Supabase Auth
- PostgreSQL
- Vercel-ready

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Variables de entorno

Copia `.env.example` a `.env.local` y completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Rutas iniciales

- `/`
- `/app/dashboard`
- `/app/reservas`
- `/app/clientes`
- `/app/calendario`
- `/app/marketing`
- `/app/fidelizacion`
- `/app/wallet`
- `/app/inventario`
- `/app/rrhh`
- `/app/reportes`
- `/app/configuracion`
- `/login`
- `/register`
- `/logout`

## Etapa 2

Implementado:

- Supabase SSR client, server client, admin client y middleware.
- Proteccion de rutas bajo `/app`.
- Registro con creacion de usuario, negocio, owner y modulos base.
- Helper `getCurrentBusiness()` para resolver tenant y rol.
- Dashboard con metricas reales desde Supabase.
- CRUD funcional base para clientes y reservas.
- Timeline de cliente con `customer_events`.
- Notas, tareas y comentarios internos basicos desde el detalle del cliente.
- Agenda simple en `/app/calendario`.

El `SUPABASE_SERVICE_ROLE_KEY` solo se usa en servidor para bootstrap del negocio.

## Supabase

La migracion inicial vive en:

```bash
supabase/migrations/001_initial_hospitality_os.sql
```

Incluye:

- `businesses`
- `business_users`
- `modules`
- `business_modules`
- `customers`
- `reservations`
- `customer_events`
- `internal_notes`
- `internal_tasks`
- `internal_comments`
- `business_hours`
- `tables`

Pagos, wallet real, WhatsApp, push notifications, geolocalizacion, inventario
avanzado, nomina y app movil quedan fuera de esta primera fase.
