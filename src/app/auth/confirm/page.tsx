"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 300;

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function safeNextPath(nextPath: string | null) {
  if (nextPath?.startsWith("/app") || nextPath?.startsWith("/superadmin")) {
    return nextPath;
  }

  return "/app/dashboard";
}

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [attempt, setAttempt] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function confirmSession() {
      const supabase = createClient();

      for (let currentAttempt = 1; currentAttempt <= MAX_ATTEMPTS; currentAttempt += 1) {
        if (cancelled) {
          return;
        }

        setAttempt(currentAttempt);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log("AUTH_CONFIRM_SESSION_CHECK", {
          attempt: currentAttempt,
          sessionFound: Boolean(session),
        });

        if (session) {
          router.replace(nextPath);
          router.refresh();
          return;
        }

        if (currentAttempt < MAX_ATTEMPTS) {
          await delay(RETRY_DELAY_MS);
        }
      }

      if (!cancelled) {
        setError("No pudimos confirmar tu sesion en el navegador.");
      }
    }

    void confirmSession();

    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
      <section className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-950">Preparando tu sesion...</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Esto puede tardar unos segundos.
        </p>
        <p className="mt-4 text-xs font-medium text-stone-400">
          Intento {attempt} de {MAX_ATTEMPTS}
        </p>
        {error ? (
          <div className="mt-5">
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-stone-950 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Volver a login
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
          <div className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600 shadow-sm">
            Preparando tu sesion...
          </div>
        </main>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}
