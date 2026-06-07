import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  detail: string;
  tone?: "dark" | "light";
};

export function StatCard({ title, value, detail, tone = "light" }: StatCardProps) {
  const dark = tone === "dark";

  return (
    <div
      className={[
        "rounded-lg border p-5 shadow-sm",
        dark
          ? "border-stone-900 bg-stone-950 text-white"
          : "border-stone-200 bg-white text-stone-950",
      ].join(" ")}
    >
      <p className={dark ? "text-sm text-stone-400" : "text-sm text-stone-500"}>
        {title}
      </p>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
      <p className={dark ? "mt-2 text-xs text-stone-400" : "mt-2 text-xs text-stone-500"}>
        {detail}
      </p>
    </div>
  );
}

export function ModuleCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-stone-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>
        </div>
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

const statusClasses: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-stone-200 bg-stone-100 text-stone-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  no_show: "border-rose-200 bg-rose-50 text-rose-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-stone-200 bg-stone-50 text-stone-600",
  suspended: "border-red-200 bg-red-50 text-red-700",
  scheduled: "border-sky-200 bg-sky-50 text-sky-700",
  missed: "border-red-200 bg-red-50 text-red-700",
  urgent: "border-red-200 bg-red-50 text-red-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  medium: "border-sky-200 bg-sky-50 text-sky-700",
  low: "border-stone-200 bg-stone-50 text-stone-600",
  bronze: "border-orange-200 bg-orange-50 text-orange-800",
  silver: "border-zinc-200 bg-zinc-50 text-zinc-700",
  gold: "border-yellow-200 bg-yellow-50 text-yellow-800",
  black: "border-stone-900 bg-stone-950 text-white",
  earn: "border-emerald-200 bg-emerald-50 text-emerald-700",
  redeem: "border-purple-200 bg-purple-50 text-purple-700",
  adjustment: "border-sky-200 bg-sky-50 text-sky-700",
  entry: "border-emerald-200 bg-emerald-50 text-emerald-700",
  sale: "border-stone-200 bg-stone-50 text-stone-700",
  waste: "border-red-200 bg-red-50 text-red-700",
  transfer: "border-indigo-200 bg-indigo-50 text-indigo-700",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  near_expiration: "border-amber-200 bg-amber-50 text-amber-700",
  expired: "border-stone-200 bg-stone-50 text-stone-600",
  used: "border-stone-200 bg-stone-100 text-stone-600",
  working: "border-emerald-200 bg-emerald-50 text-emerald-700",
  on_break: "border-amber-200 bg-amber-50 text-amber-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={[
        "inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium",
        statusClasses[status] ?? "border-stone-200 bg-stone-50 text-stone-600",
      ].join(" ")}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
      <Inbox className="mx-auto text-stone-400" size={28} />
      <p className="mt-4 text-sm font-semibold text-stone-950">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
        {description}
      </p>
    </div>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          <thead className="bg-stone-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-stone-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="whitespace-nowrap px-4 py-4 text-stone-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
