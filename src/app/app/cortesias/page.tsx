import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function CourtesiesPage() {
  redirect("/app/operacion?tab=cierre&action=cortesia");
}
