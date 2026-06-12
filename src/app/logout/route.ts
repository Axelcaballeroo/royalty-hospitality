import { NextResponse, type NextRequest } from "next/server";
import { demoAuthCookieOptions, demoUserEmailCookie, demoUserIdCookie } from "@/lib/demo-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const response = NextResponse.redirect(new URL("/login", request.url));
  const expiredCookieOptions = {
    ...demoAuthCookieOptions,
    maxAge: 0,
  };

  response.cookies.set(demoUserIdCookie, "", expiredCookieOptions);
  response.cookies.set(demoUserEmailCookie, "", expiredCookieOptions);

  return response;
}
