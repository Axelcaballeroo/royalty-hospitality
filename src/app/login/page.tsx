"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Crown } from "lucide-react";
import { Suspense, useState, type FormEvent } from "react";
import { isValidEmail, normalizeEmail } from "@/lib/auth-email";
import { createClient } from "@/lib/supabase/client";

type LoginDebugState = {
  errorMessage: string;
  signInUserFound: boolean;
  signInSessionFound: boolean;
  sessionCheckFound: boolean;
  supabaseUrl: string;
};

function safeNextPath(nextPath: string | null) {
  if (nextPath?.startsWith("/app") || nextPath?.startsWith("/superadmin")) {
    return nextPath;
  }

  return "/app/dashboard";
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const initialError = searchParams.get("error");
  const [error, setError] = useState(initialError ? decodeURIComponent(initialError) : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugState, setDebugState] = useState<LoginDebugState>({
    errorMessage: initialError ? decodeURIComponent(initialError) : "",
    signInUserFound: false,
    signInSessionFound: false,
    sessionCheckFound: false,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "missing",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    setDebugState({
      errorMessage: "",
      signInUserFound: false,
      signInSessionFound: false,
      sessionCheckFound: false,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "missing",
    });

    const formData = new FormData(event.currentTarget);
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const password = String(formData.get("password") ?? "");

    if (!email || !password || !isValidEmail(email)) {
      setError("Ingresa un email valido y password.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("LOGIN_ERROR", signInError);
    console.log("LOGIN_DATA", data);

    setDebugState((current) => ({
      ...current,
      errorMessage: signInError?.message ?? "",
      signInUserFound: Boolean(data.user),
      signInSessionFound: Boolean(data.session),
    }));

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    if (!data.session) {
      setError("Login válido pero Supabase no devolvió sesión.");
      setIsSubmitting(false);
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });

    const {
      data: sessionCheck,
    } = await supabase.auth.getSession();

    console.log("SESSION_CHECK", sessionCheck);

    setDebugState((current) => ({
      ...current,
      sessionCheckFound: Boolean(sessionCheck.session),
    }));

    if (!sessionCheck.session) {
      setError("La sesión no quedó guardada en el navegador.");
      setIsSubmitting(false);
      return;
    }

    router.replace(`/auth/confirm?next=${encodeURIComponent(nextPath)}`);
    router.refresh();
  }

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
          <form onSubmit={handleSubmit}>
            <label className="mt-6 block text-sm font-medium text-stone-700">
              Email
              <input
                required
                type="text"
                inputMode="email"
                name="email"
                className="mt-2 h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none transition focus:border-stone-400"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-stone-700">
              Password
              <input
                required
                type="password"
                name="password"
                className="mt-2 h-11 w-full rounded-lg border border-stone-200 px-3 text-sm outline-none transition focus:border-stone-400"
              />
            </label>
            <button
              disabled={isSubmitting}
              className="mt-6 h-11 w-full rounded-lg bg-stone-950 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-stone-500">
            No tienes cuenta?{" "}
            <Link href="/register" className="font-medium text-stone-950">
              Crear negocio
            </Link>
          </p>
          <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
            <p className="font-semibold text-stone-800">Debug login</p>
            <dl className="mt-2 space-y-1">
              <div className="flex justify-between gap-3">
                <dt>Error</dt>
                <dd className="text-right">{debugState.errorMessage || "none"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>data.user existe</dt>
                <dd>{debugState.signInUserFound ? "yes" : "no"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>data.session existe</dt>
                <dd>{debugState.signInSessionFound ? "yes" : "no"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>getSession session existe</dt>
                <dd>{debugState.sessionCheckFound ? "yes" : "no"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Supabase URL</dt>
                <dd className="max-w-[220px] truncate text-right">{debugState.supabaseUrl}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
          <div className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600 shadow-sm">
            Cargando login...
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
