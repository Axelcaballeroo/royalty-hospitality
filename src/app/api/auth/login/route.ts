import { NextResponse } from "next/server";
import { isValidEmail, normalizeEmail } from "@/lib/auth-email";
import { isSafePrivateNextPath } from "@/lib/demo-auth";
import { createClient } from "@/lib/supabase/server";

type LoginBody = {
  email?: unknown;
  password?: unknown;
  next?: unknown;
};

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud invalida." }, { status: 400 });
  }

  const email = normalizeEmail(String(body.email ?? ""));
  const password = String(body.password ?? "");
  const requestedNext = String(body.next ?? "");
  const redirectTo = isSafePrivateNextPath(requestedNext) ? requestedNext : "/app/dashboard";

  if (!email || !password || !isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Ingresa un email valido y password." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Login invalido." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    userId: data.user.id,
    email: data.user.email ?? email,
    redirectTo,
  });

  return response;
}
