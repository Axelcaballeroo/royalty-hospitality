"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type BrowserAuthState = {
  accessTokenExists: boolean;
  sessionFound: boolean;
  userEmail: string | null;
};

export function AuthDebugClient() {
  const [state, setState] = useState<BrowserAuthState | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setState({
          accessTokenExists: Boolean(session?.access_token),
          sessionFound: Boolean(session),
          userEmail: session?.user.email ?? null,
        });
      }
    }

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  const rows = [
    ["Browser session found", state === null ? "checking..." : state.sessionFound ? "yes" : "no"],
    ["Browser user email", state?.userEmail ?? "No browser session"],
    [
      "Browser access token exists",
      state === null ? "checking..." : state.accessTokenExists ? "yes" : "no",
    ],
  ];

  return (
    <>
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr]">
          <dt className="text-sm font-medium text-stone-500">{label}</dt>
          <dd className="break-words text-sm text-stone-950">{value}</dd>
        </div>
      ))}
    </>
  );
}
