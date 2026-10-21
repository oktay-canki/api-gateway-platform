type FormFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
};

export function FormField({
  id,
  label,
  type = "text",
  value,
  placeholder,
  autoComplete,
  onChange,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-200"
      >
        {label}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );
}
