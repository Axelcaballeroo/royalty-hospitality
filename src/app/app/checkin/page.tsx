import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StaffCheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams({ tab: "sala" });

  if (params.error) {
    query.set("error", params.error);
  }

  if (params.success) {
    query.set("success", params.success);
  }

  redirect(`/app/operacion?${query.toString()}`);
}
