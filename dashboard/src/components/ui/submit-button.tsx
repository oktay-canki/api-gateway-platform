type SubmitButtonProps = {
  isSubmitting: boolean;
  children: React.ReactNode;
  submittingText: string;
};

export function SubmitButton({
  isSubmitting,
  children,
  submittingText,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isSubmitting ? submittingText : children}
    </button>
  );
}
