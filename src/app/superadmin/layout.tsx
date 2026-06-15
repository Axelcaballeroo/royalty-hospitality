import Link from "next/link";
import { Crown } from "lucide-react";
import { requireSuperadmin } from "@/lib/superadmin";
import { getAuthSession, isAuthRateLimited } from "@/lib/auth/session";

const nav = [
  ["Dashboard", "/superadmin"],
  ["Negocios", "/superadmin/businesses"],
  ["Usuarios", "/superadmin/users"],
  ["Planes", "/superadmin/plans"],
  ["Modulos", "/superadmin/modules"],
];

export default async function SuperadminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getAuthSession();
  if (isAuthRateLimited(session)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 text-white">
        <section className="max-w-md rounded-2xl border border-white/10 bg-white p-6 text-center text-stone-950">
          <p className="text-lg font-semibold">Estamos validando tu sesion.</p>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            Supabase limito temporalmente la validacion de Auth. Intenta recargar en unos segundos.
          </p>
        </section>
      </main>
    );
  }

  await requireSuperadmin();

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <header className="border-b border-white/10 bg-stone-950/95 px-5 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/superadmin" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-white text-stone-950">
              <Crown size={19} />
            </span>
            <span>
              <span className="block text-sm font-semibold">Royalty Studio</span>
              <span className="block text-xs text-stone-400">SaaS control center</span>
            </span>
          </Link>
          <nav className="flex flex-wrap gap-2">
            {nav.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-stone-300 transition hover:bg-white hover:text-stone-950"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/app/dashboard"
              className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-stone-950"
            >
              Volver al app
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 text-stone-950">{children}</main>
    </div>
  );
}
