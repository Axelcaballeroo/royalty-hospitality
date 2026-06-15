import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { getAuthSession, isAuthRateLimited } from "@/lib/auth/session";

function SessionValidationMessage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
      <section className="max-w-md rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-[0_20px_70px_rgba(28,25,23,0.08)]">
        <p className="text-lg font-semibold text-stone-950">Estamos validando tu sesion.</p>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          Supabase limito temporalmente la validacion de Auth. Intenta recargar en unos segundos.
        </p>
      </section>
    </main>
  );
}

export default async function PrivateAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthSession();

  if (isAuthRateLimited(session)) {
    return <SessionValidationMessage />;
  }

  if (!session.user) {
    redirect("/login");
  }

  return (
    <div className="premium-surface min-h-screen">
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />
          <AppHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
