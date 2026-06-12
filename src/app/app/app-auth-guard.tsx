"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AppAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (!session) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setIsCheckingSession(false);
      router.refresh();
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 px-6">
        <div className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600 shadow-sm">
          Verificando sesion...
        </div>
      </div>
    );
  }

  return children;
}
