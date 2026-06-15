import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DailyClosurePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams({ tab: "cierre" });

  if (params.date) {
    query.set("date", params.date);
  }

  if (params.error) {
    query.set("error", params.error);
  }

  if (params.success) {
    query.set("success", params.success);
  }

  redirect(`/app/operacion?${query.toString()}`);
}
