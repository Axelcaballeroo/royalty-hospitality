import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseBrowserEnv } from "@/lib/supabase/env";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function copySupabaseCookies(response: NextResponse, cookiesToSet: CookieToSet[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

function redirectWithSupabaseCookies(
  request: NextRequest,
  pathname: string,
  cookiesToSet: CookieToSet[],
  searchParams?: Record<string, string>,
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return copySupabaseCookies(NextResponse.redirect(redirectUrl), cookiesToSet);
}

export async function updateSession(request: NextRequest) {
  const refreshedCookies: CookieToSet[] = [];
  let response = NextResponse.next({
    request,
  });

  let supabaseEnv;
  try {
    supabaseEnv = getSupabaseBrowserEnv();
  } catch {
    return response;
  }

  const supabase = createServerClient(supabaseEnv.supabaseUrl, supabaseEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        refreshedCookies.push(...cookiesToSet);
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPrivateRoute =
    request.nextUrl.pathname.startsWith("/app") ||
    request.nextUrl.pathname.startsWith("/superadmin");

  if (isPrivateRoute && !user) {
    return redirectWithSupabaseCookies(request, "/login", refreshedCookies, {
      next: `${request.nextUrl.pathname}${request.nextUrl.search}`,
    });
  }

  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") && user) {
    return redirectWithSupabaseCookies(request, "/app/dashboard", refreshedCookies);
  }

  return response;
}
