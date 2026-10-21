type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-16 text-center shadow-xl">
      <h2 className="text-lg font-medium text-white">{title}</h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
        {description}
      </p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
