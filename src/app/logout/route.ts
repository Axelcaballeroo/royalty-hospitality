import { NextResponse } from "next/server";
import { demoUserEmailCookie, demoUserIdCookie } from "@/lib/demo-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const response = new NextResponse(
    `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0;url=/login" />
  </head>
  <body>
    <script>
      document.cookie = "rh_demo_user_id=; path=/; max-age=0";
      document.cookie = "rh_demo_user_email=; path=/; max-age=0";
      window.location.replace("/login");
    </script>
  </body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );

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
