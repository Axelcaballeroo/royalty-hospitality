import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/demo-auth";

export async function GET() {
  const user = await getAuthenticatedUser();

  return NextResponse.json(
    {
      authenticated: Boolean(user),
      source: user?.source ?? null,
      user: user
        ? {
            id: user.id,
            email: user.email,
          }
        : null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
