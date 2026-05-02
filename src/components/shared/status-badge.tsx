const colorMap: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-slate-700 text-white",
  draft: "bg-slate-100 text-slate-800",
  pending_review: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-emerald-100 text-emerald-800",
  no_show: "bg-violet-100 text-violet-800",
  unpaid: "bg-red-100 text-red-800",
  partially_paid: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  waived: "bg-blue-100 text-blue-800",
  refunded: "bg-violet-100 text-violet-800",
};

export function StatusBadge({ value }: { value: string }) {
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${colorMap[value] ?? "bg-slate-100 text-slate-700"}`}>{value}</span>;
}
