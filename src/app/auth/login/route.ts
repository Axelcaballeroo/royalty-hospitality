import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isValidEmail, normalizeEmail } from "@/lib/auth-email";

function safeNextPath(nextPath: FormDataEntryValue | null) {
  const value = typeof nextPath === "string" ? nextPath : "";

  if (value.startsWith("/app") || value.startsWith("/superadmin")) {
    return value;
  }

  return "/app/dashboard";
}

function buildLoginRedirect(request: NextRequest, input: { error: string; nextPath: string }) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", input.error);
  loginUrl.searchParams.set("next", input.nextPath);
  return NextResponse.redirect(loginUrl, { status: 303 });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const nextPath = safeNextPath(formData.get("next"));

  if (!email || !password || !isValidEmail(email)) {
    return buildLoginRedirect(request, {
      error: "Ingresa un email valido y password.",
      nextPath,
    });
  }

  const successUrl = new URL(nextPath, request.url);
  let response = NextResponse.redirect(successUrl, { status: 303 });

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
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    response = buildLoginRedirect(request, {
      error: error.message,
      nextPath,
    });
  }

  return response;
}
