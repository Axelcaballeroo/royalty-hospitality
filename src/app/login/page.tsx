import Link from "next/link";
import { Crown } from "lucide-react";

function safeNextPath(nextPath: string | string[] | undefined) {
  const value = Array.isArray(nextPath) ? nextPath[0] : nextPath;

  if (value?.startsWith("/app") || value?.startsWith("/superadmin")) {
    return value;
  }

  return "/app/dashboard";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="grid min-h-screen bg-stone-50 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden bg-stone-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-white text-stone-950">
            <Crown size={18} />
          </span>
          <span className="text-sm font-semibold">Royalty Hospitality OS</span>
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Acceso privado
          </p>
          <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight">
            Gestiona clientes, reservas y operacion desde un solo tenant.
          </h1>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-stone-950">Iniciar sesion</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            Entra con tu email y password de Supabase Auth.
          </p>
          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <form action="/auth/login" method="post">
            <input type="hidden" name="next" value={nextPath} />
            <label className="mt-6 block text-sm font-medium text-stone-700">
              Email
              <input
                required
                type="email"
                inputMode="email"
                name="email"
                autoComplete="email"
                className="mt-2 h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none transition focus:border-stone-400"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-stone-700">
              Password
              <input
                required
                type="password"
                name="password"
                autoComplete="current-password"
                className="mt-2 h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none transition focus:border-stone-400"
              />
            </label>
            <button className="mt-6 h-11 w-full rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800">
              Entrar
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-stone-500">
            No tienes cuenta?{" "}
            <Link href="/register" className="font-medium text-stone-950">
              Crear negocio
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
