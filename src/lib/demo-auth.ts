import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const demoUserIdCookie = "rh_demo_user_id";
export const demoUserEmailCookie = "rh_demo_user_email";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  source: "supabase" | "demo-cookie";
};

export const demoAuthCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export function isSafePrivateNextPath(nextPath: string) {
  return nextPath.startsWith("/app") || nextPath.startsWith("/superadmin");
}

export async function getDemoAuthCookieUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(demoUserIdCookie)?.value;

  if (!userId) {
    return null;
  }

  return {
    id: userId,
    email: cookieStore.get(demoUserEmailCookie)?.value ?? null,
    source: "demo-cookie",
  };
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return {
      id: user.id,
      email: user.email ?? null,
      source: "supabase",
    };
  }

  return getDemoAuthCookieUser();
}
