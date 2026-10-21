type PageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {title}
        </h1>

        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>

      {action}
    </header>
  );
}
