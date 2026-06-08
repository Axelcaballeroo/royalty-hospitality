import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { formatAnyLabel } from "@/lib/formatters";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2";

type ButtonProps = {
  children: ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
};

export function PrimaryButton({ children, className = "", type = "submit" }: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300",
        focusRing,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", type = "submit" }: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-400",
        focusRing,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, className = "", type = "submit" }: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60",
        focusRing,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-stone-950">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

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
        "rounded-lg border p-5 shadow-sm transition hover:shadow-md",
        dark
          ? "border-stone-900 bg-stone-950 text-white"
          : "border-stone-200 bg-white text-stone-950",
      ].join(" ")}
    >
      <p className={dark ? "text-sm text-stone-400" : "text-sm text-stone-500"}>
        {title}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-normal">{value}</p>
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
  basic: "border-stone-200 bg-stone-50 text-stone-700",
  pro: "border-sky-200 bg-sky-50 text-sky-700",
  premium: "border-violet-200 bg-violet-50 text-violet-700",
  business: "border-stone-900 bg-stone-950 text-white",
  frozen: "border-sky-200 bg-sky-50 text-sky-700",
  closed: "border-stone-200 bg-stone-100 text-stone-600",
  topup: "border-emerald-200 bg-emerald-50 text-emerald-700",
  bonus: "border-yellow-200 bg-yellow-50 text-yellow-800",
  purchase: "border-red-200 bg-red-50 text-red-700",
  refund: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  skipped: "border-amber-200 bg-amber-50 text-amber-700",
  superadmin: "border-stone-900 bg-stone-950 text-white",
  owner: "border-emerald-200 bg-emerald-50 text-emerald-700",
  manager: "border-sky-200 bg-sky-50 text-sky-700",
  staff: "border-stone-200 bg-stone-50 text-stone-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={[
        "inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium capitalize",
        statusClasses[status] ?? "border-stone-200 bg-stone-50 text-stone-600",
      ].join(" ")}
    >
      {formatAnyLabel(status)}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
      <Inbox className="mx-auto text-stone-400" size={28} />
      <p className="mt-4 text-sm font-semibold text-stone-950">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-lg bg-stone-200/80",
        className || "h-24",
      ].join(" ")}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="h-10 w-72" />
        <SkeletonBlock className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock />
      </div>
      <SkeletonBlock className="h-80" />
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  caption,
}: {
  columns: string[];
  rows: ReactNode[][];
  caption?: string;
}) {
  const visibleRows = rows.slice(0, 25);

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
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
            {visibleRows.map((row, index) => (
              <tr key={index} className="transition hover:bg-stone-50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="max-w-[18rem] whitespace-nowrap px-4 py-4 text-stone-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2 border-t border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Mostrando {visibleRows.length} de {rows.length} registros
        </span>
        <span>Paginacion simple: primeros 25 resultados</span>
      </div>
    </div>
  );
}
