"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isValidEmail, normalizeEmail } from "@/lib/auth-email";
import { createClient } from "@/lib/supabase/client";

function safeNextPath(nextPath: string) {
  if (nextPath.startsWith("/app") || nextPath.startsWith("/superadmin")) {
    return nextPath;
  }

  return "/app/dashboard";
}

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = normalizeEmail(String(formData.get("email") ?? ""));
    const password = String(formData.get("password") ?? "");

    if (!email || !password || !isValidEmail(email)) {
      setError("Ingresa un email valido y password.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    router.replace(safeNextPath(nextPath));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
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
  );
}
