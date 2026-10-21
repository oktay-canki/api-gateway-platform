type StatusBadgeProps = {
  status: "active" | "revoked";
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const isActive = status === "active";

  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${
        isActive
          ? "border-emerald-900/50 bg-emerald-950/40 text-emerald-400"
          : "border-slate-700 bg-slate-950 text-slate-400"
      }`}
    >
      {status}
    </span>
  );
}
