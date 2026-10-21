type ErrorMessageProps = {
  message: string;
};

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2.5 text-sm text-red-400"
    >
      {message}
    </div>
  );
}
