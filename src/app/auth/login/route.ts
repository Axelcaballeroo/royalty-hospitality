import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isValidEmail, normalizeEmail } from "@/lib/auth-email";

function safeNextPath(nextPath: FormDataEntryValue | null) {
  const value = typeof nextPath === "string" ? nextPath : "";

  if (value.startsWith("/app") || value.startsWith("/superadmin")) {
    return value;
  }

  return "/app/operacion";
}

function buildLoginRedirect(request: NextRequest, input: { error: string; nextPath: string }) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", input.error);
  loginUrl.searchParams.set("next", input.nextPath);
  return NextResponse.redirect(loginUrl, { status: 303 });
}

export async function POST(request: NextRequest) {
  console.log("AUTH LOGIN ROUTE HIT");

  const formData = await request.formData();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const nextPath = safeNextPath(formData.get("next"));
  const origin = request.nextUrl.origin;

  if (!email || !password || !isValidEmail(email)) {
    return buildLoginRedirect(request, {
      error: "Ingresa un email valido y password.",
      nextPath,
    });
  }

  const successUrl = new URL(nextPath, origin);
  const response = NextResponse.redirect(successUrl, { status: 303 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              path: "/",
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            });
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("AUTH LOGIN SESSION", Boolean(data.session));

  if (error || !data.session) {
    return buildLoginRedirect(request, {
      error: error?.message || "No se pudo iniciar sesion",
      nextPath,
    });
  }

  response.headers.set("x-auth-login", "ok");
  response.headers.set("x-auth-session", "yes");

  return response;
}
