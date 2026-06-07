import { NextResponse } from "next/server";
import { getCurrentBusiness } from "@/lib/current-business";
import { createClient } from "@/lib/supabase/server";
import { getExecutiveReportsData, type ReportPeriod } from "@/lib/data";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: unknown[][]) {
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ].join("\n");
}

function getRange(period: ReportPeriod) {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "7d") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    start.setDate(start.getDate() - 89);
    start.setHours(0, 0, 0, 0);
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export async function GET(request: Request) {
  const current = await getCurrentBusiness();
  const supabase = await createClient();
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "report";
  const periodParam = url.searchParams.get("period") as ReportPeriod | null;
  const period: ReportPeriod = ["today", "7d", "month", "90d"].includes(periodParam ?? "")
    ? periodParam ?? "month"
    : "month";
  const range = getRange(period);

  let csv = "";
  let filename = `royalty-${type}-${period}.csv`;

  if (type === "customers") {
    const { data } = await supabase
      .from("customers")
      .select("id, full_name, phone, email, total_visits, total_spent, status, created_at")
      .eq("business_id", current.businessId)
      .order("created_at", { ascending: false });
    csv = toCsv(
      ["id", "full_name", "phone", "email", "total_visits", "total_spent", "status", "created_at"],
      (data ?? []).map((customer) => [
        customer.id,
        customer.full_name,
        customer.phone,
        customer.email,
        customer.total_visits,
        customer.total_spent,
        customer.status,
        customer.created_at,
      ]),
    );
  } else if (type === "reservations") {
    const { data } = await supabase
      .from("reservations")
      .select("id, date, time, party_size, status, source, customers(full_name, phone)")
      .eq("business_id", current.businessId)
      .gte("date", range.startDate)
      .lte("date", range.endDate)
      .order("date", { ascending: false });
    csv = toCsv(
      ["id", "date", "time", "customer", "phone", "party_size", "status", "source"],
      (data ?? []).map((reservation) => {
        const customer = Array.isArray(reservation.customers)
          ? reservation.customers[0]
          : reservation.customers;
        return [
          reservation.id,
          reservation.date,
          reservation.time,
          customer?.full_name,
          customer?.phone,
          reservation.party_size,
          reservation.status,
          reservation.source,
        ];
      }),
    );
  } else {
    const { metrics } = await getExecutiveReportsData(period);
    csv = toCsv(
      ["section", "metric", "value"],
      [
        ["reservations", "total", metrics.reservations.total],
        ["reservations", "confirmed", metrics.reservations.confirmed],
        ["reservations", "completed", metrics.reservations.completed],
        ["customers", "new", metrics.customers.new],
        ["customers", "inactive", metrics.customers.inactive],
        ["loyalty", "points_issued", metrics.loyalty.pointsIssued],
        ["marketing", "campaigns_sent", metrics.marketing.campaignsSent],
        ["inventory", "open_alerts", metrics.inventory.openAlerts],
        ["hr", "active_employees", metrics.hr.activeEmployees],
      ],
    );
    filename = `royalty-report-${period}.csv`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
