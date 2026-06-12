"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthMeResponse = {
  authenticated?: boolean;
  userId?: string | null;
  email?: string | null;
  business?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  role?: string | null;
};

export function AuthDebugClient() {
  const [sessionFound, setSessionFound] = useState<boolean | null>(null);
  const [authMe, setAuthMe] = useState<AuthMeResponse | null>(null);
  const [currentUrl] = useState(() =>
    typeof window === "undefined" ? "" : window.location.href,
  );

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authMeResponse = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "include",
      });
      const authMeData = (await authMeResponse.json()) as AuthMeResponse;

      if (mounted) {
        setSessionFound(Boolean(session));
        setAuthMe(authMeData);
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const value =
    sessionFound === null ? "checking..." : sessionFound ? "yes" : "no";
  const authMeValue = authMe === null ? "checking..." : authMe.authenticated ? "yes" : "no";

  return (
    <>
      <div className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
        <dt className="text-sm font-medium text-stone-500">Client session found</dt>
        <dd className="break-words text-sm text-stone-950">{value}</dd>
      </div>
      <div className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
        <dt className="text-sm font-medium text-stone-500">Browser URL</dt>
        <dd className="break-words text-sm text-stone-950">{currentUrl || "checking..."}</dd>
      </div>
      <div className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
        <dt className="text-sm font-medium text-stone-500">/api/auth/me authenticated</dt>
        <dd className="break-words text-sm text-stone-950">{authMeValue}</dd>
      </div>
      <div className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
        <dt className="text-sm font-medium text-stone-500">/api/auth/me business</dt>
        <dd className="break-words text-sm text-stone-950">
          {authMe?.business ? `${authMe.business.name} (${authMe.business.id})` : "Not found"}
        </dd>
      </div>
      <div className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
        <dt className="text-sm font-medium text-stone-500">/api/auth/me role</dt>
        <dd className="break-words text-sm text-stone-950">{authMe?.role ?? "Not found"}</dd>
      </div>
    </>
  );
}
