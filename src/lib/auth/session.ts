import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type CachedAuthSession = {
  user: User | null;
  errorCode: string | null;
  errorMessage: string | null;
};

export const getAuthSession = cache(async (): Promise<CachedAuthSession> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    const code = "code" in error ? String(error.code) : null;
    console.error("getAuthUser error:", error.message, code);

    return {
      user: null,
      errorCode: code,
      errorMessage: error.message,
    };
  }

  return {
    user: data.user ?? null,
    errorCode: null,
    errorMessage: null,
  };
});

export const getAuthUser = cache(async () => {
  const session = await getAuthSession();
  return session.user;
});

export function isAuthRateLimited(session: CachedAuthSession) {
  return session.errorCode === "over_request_rate_limit";
}
