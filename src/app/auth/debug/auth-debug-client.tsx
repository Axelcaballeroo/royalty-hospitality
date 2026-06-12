"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthDebugClient() {
  const [sessionFound, setSessionFound] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSessionFound(Boolean(session));
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const value =
    sessionFound === null ? "checking..." : sessionFound ? "yes" : "no";

  return (
    <div className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
      <dt className="text-sm font-medium text-stone-500">Client session found</dt>
      <dd className="break-words text-sm text-stone-950">{value}</dd>
    </div>
  );
}
