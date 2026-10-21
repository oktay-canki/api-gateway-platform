type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          {title}
        </h1>

        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
        {children}

        {footer && (
          <div className="mt-6 text-center text-sm text-slate-400">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
