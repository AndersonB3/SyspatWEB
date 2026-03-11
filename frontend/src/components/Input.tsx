'use client';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl
            text-white placeholder-slate-500 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40
            transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500/50 focus:ring-red-500/40' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl
          text-white text-sm appearance-none
          focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40
          transition-all duration-200
          ${error ? 'border-red-500/50' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-800">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl
          text-white placeholder-slate-500 text-sm resize-none
          focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40
          transition-all duration-200
          ${error ? 'border-red-500/50' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
