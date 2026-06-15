import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function IncidentsPage() {
  redirect("/app/operacion?tab=alertas");
}
