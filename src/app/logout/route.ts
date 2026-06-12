import { NextResponse, type NextRequest } from "next/server";
import { clearDemoAuthCookies } from "@/lib/demo-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearDemoAuthCookies();

  return NextResponse.redirect(new URL("/login", request.url));
}
