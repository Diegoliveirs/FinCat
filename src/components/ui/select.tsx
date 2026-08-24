import { forwardRef } from "react";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = "", children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={`bg-bg/60 text-ink focus:border-brand/60 w-full appearance-none rounded-xl border border-white/10 px-3.5 py-2.5 pr-9 text-sm transition-colors outline-none ${className}`}
        {...rest}
      >
        {children}
      </select>
      <svg
        className="text-muted pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
});
