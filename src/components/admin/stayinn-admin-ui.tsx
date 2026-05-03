import Link from "next/link";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: string;
  tone?: "cyan" | "emerald" | "amber" | "violet" | "rose" | "blue";
};

type BadgeProps = {
  children: React.ReactNode;
  tone?: "green" | "amber" | "red" | "slate" | "blue" | "violet";
};

const statToneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  cyan: "text-cyan-600 bg-cyan-50",
  emerald: "text-emerald-600 bg-emerald-50",
  amber: "text-amber-600 bg-amber-50",
  violet: "text-violet-600 bg-violet-50",
  rose: "text-rose-600 bg-rose-50",
  blue: "text-blue-600 bg-blue-50",
};

const badgeToneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
};

export function AdminPageHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
          {title}
        </h1>

        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>

      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-900/15 transition hover:scale-[1.01]"
        >
          + {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon = "•",
  tone = "cyan",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${statToneClasses[tone]}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-0.5 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </p>

          {hint ? (
            <p
              className={`mt-0.5 text-[11px] font-bold ${
                statToneClasses[tone].split(" ")[0]
              }`}
            >
              ↗ {hint}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AdminCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-black text-slate-950">{title}</h2>
        {description ? (
          <p className="text-xs text-slate-500">{description}</p>
        ) : null}
      </div>

      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
        >
          + {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function AdminBadge({ children, tone = "slate" }: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${badgeToneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function AdminFilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {children}
    </div>
  );
}

export function AdminTableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-auto">{children}</div>
    </div>
  );
}