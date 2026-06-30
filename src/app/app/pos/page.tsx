import { PosClient } from "./pos-client";
import { requireCurrentBusiness } from "@/lib/current-business";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const current = await requireCurrentBusiness();
  const business = current.business;
  return <PosClient business={{
    name: business.name,
    address: [business.address, business.city, business.country].filter(Boolean).join(", "),
    phone: business.phone ?? undefined,
  }} />;
}
