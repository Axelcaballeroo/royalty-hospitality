import { NextResponse, type NextRequest } from "next/server";
import { demoUserEmailCookie, demoUserIdCookie } from "@/lib/demo-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.set(demoUserIdCookie, "", {
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(demoUserEmailCookie, "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
